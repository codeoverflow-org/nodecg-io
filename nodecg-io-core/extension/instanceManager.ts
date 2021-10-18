import { NodeCG } from "nodecg-types/types/server";
import { ObjectMap, Service, ServiceInstance } from "./service";
import { emptySuccess, error, Result } from "./utils/result";
import { ServiceManager } from "./serviceManager";
import { BundleManager } from "./bundleManager";
import Ajv from "ajv";
import { EventEmitter } from "events";

/**
 * Manages instances of services and their configs/clients.
 */
export class InstanceManager extends EventEmitter {
    private serviceInstances: ObjectMap<ServiceInstance<unknown, unknown>> = {};
    private ajv = new Ajv();

    constructor(
        private readonly nodecg: NodeCG,
        private readonly services: ServiceManager,
        private readonly bundles: BundleManager,
    ) {
        super();
        bundles.on("reregisterInstance", (serviceInstance?: string) =>
            this.reregisterHandlersOfInstance(serviceInstance),
        );
    }

    /**
     * Finds and returns the service instance with the passed name if it exists.
     * @param instanceName the name of the instance you want to get.
     * @return the wanted service instance if it has been found, undefined otherwise.
     */
    getServiceInstance(instanceName: string): ServiceInstance<unknown, unknown> | undefined {
        return this.serviceInstances[instanceName];
    }

    /**
     * Returns all existing service instances.
     * @return {ObjectMap<ServiceInstance<unknown, unknown>>} a map of the instance name to the instance.
     */
    getServiceInstances(): ObjectMap<ServiceInstance<unknown, unknown>> {
        return this.serviceInstances;
    }

    /**
     * Creates a service instance of the passed service.
     * @param serviceType the type of the service of which a instance should be created
     * @param instanceName how the instance should be named
     * @return void if everything went fine and a string describing the issue if not
     */
    createServiceInstance(serviceType: string, instanceName: string): Result<void> {
        if (!instanceName) {
            return error("Instance name must not be empty.");
        }

        // Check if a instance with the same name already exists.
        if (this.serviceInstances[instanceName] !== undefined) {
            return error("A service instance with the same name already exists.");
        }

        // Get service
        const svcResult = this.services.getService(serviceType);
        if (svcResult.failed) {
            return error("A service of this service type hasn't been registered.");
        }
        const service = svcResult.result;

        // Create actual instance and save it
        const inst = {
            serviceType: service.serviceType,
            config: service.defaultConfig,
            client: undefined,
        };
        this.serviceInstances[instanceName] = inst;
        this.emit("change");

        this.nodecg.log.info(
            `Service instance "${instanceName}" of service "${service.serviceType}" has been successfully created.`,
        );

        // Service requires no config, we can create it right now.
        if (service.requiresNoConfig) {
            this.updateInstanceClient(inst, instanceName, service);
        }

        return emptySuccess();
    }

    /**
     * Deletes a service instance with the passed name.
     * @param instanceName the name of the service instance that should be deleted.
     * @return true if it has been found and deleted, false if it couldn't been found.
     */
    deleteServiceInstance(instanceName: string): boolean {
        const instance = this.serviceInstances[instanceName];
        if (!instance) return false;

        this.nodecg.log.info(`Deleting service instance "${instanceName}"`);

        if (instance.client) {
            // Stop service instance
            this.nodecg.log.info(`Stopping client of service instance "${instanceName}"...`);
            const svc = this.services.getService(instance.serviceType);
            if (svc.failed) {
                this.nodecg.log.error(`Failed to stop client: ${svc.errorMessage}`);
            } else {
                this.nodecg.log.info(`Successfully stopped client of service instance "${instanceName}".`);
                try {
                    svc.result.stopClient(instance.client);
                } catch (e) {
                    this.nodecg.log.error(`Couldn't stop service instance: ${e}`);
                }
            }
        }

        // Remove any assignment of a bundle to this service instance
        const deps = this.bundles.getBundleDependencies();
        Object.entries(deps).forEach(
            ([bundleName, deps]) =>
                deps
                    .filter((d) => d.serviceInstance === instanceName) // Search for bundle dependencies using this instance
                    .forEach((d) => this.bundles.unsetServiceDependency(bundleName, d.serviceType)), // unset all these
        );

        // Delete and save
        delete this.serviceInstances[instanceName];
        this.emit("change");

        return true;
    }

    /**
     * Updates the config of a service instance.
     * Before actually setting the new config, it validates it against the json schema of the service and
     * the validate function of the service.
     * @param instanceName the name of the service instance of which the config should be set.
     * @param config the actual config that will be given to the service instance.
     * @param validation whether the config should be validated, defaults to true.
     *                   Should only be false if it has been validated at a previous point in time, e.g. loading after startup.
     * @return void if everything went fine and a string describing the issue if something went wrong.
     */
    updateInstanceConfig(instanceName: string, config: unknown, validation = true): Promise<Result<void>> {
        // Check existence and get service instance.
        const inst = this.serviceInstances[instanceName];
        if (inst === undefined) {
            return Promise.resolve(error("Service instance doesn't exist."));
        }

        const service = this.services.getService(inst.serviceType);
        if (service.failed) {
            return Promise.resolve(error("The service of this instance couldn't be found."));
        }

        // If we don't need validation, because we are loading the configuration from disk, we can set it directly
        // so that after we return the promise from updateInstanceClient the PersistenceManager can be sure that the
        // config has been written.
        // Can also be used when there is no configuration needed so that we don't spawn another promise.
        if (!validation || service.result.requiresNoConfig) {
            inst.config = config;
            this.emit("change");
            return this.updateInstanceClient(inst, instanceName, service.result);
        }

        // We need to do validation, spawn a Promise
        return (async () => {
            // If the service has a schema, check it.
            if (service.result.schema) {
                const schemaValid = this.ajv.validate(service.result.schema, config);
                if (!schemaValid) {
                    return error("Config invalid: " + this.ajv.errorsText());
                }
            }

            // Validation by the service.
            try {
                const validationRes = await service.result.validateConfig(config);
                if (validationRes.failed) {
                    throw validationRes.errorMessage;
                }
            } catch (err) {
                this.nodecg.log.warn(
                    `Couldn't validate config of ${service.result.serviceType} instance "${instanceName}": ${err}`,
                );
                return error("Config invalid: " + err);
            }

            // All checks passed. Set config and save it.
            inst.config = config;
            this.emit("change");

            // Update client of this instance using the new config.
            const updateResult = await this.updateInstanceClient(inst, instanceName, service.result);

            return updateResult;
        })();
    }

    /**
     * Updates the client of a service instance by calling the underlying service to generate a new client
     * using the new config and also let all bundle depending on it update their client.
     * @param inst the instance of which the client should be generated.
     * @param instanceName the name of the service instance, used for letting all bundles know of the new client.
     * @param service the service of the service instance, needed to stop old client
     */
    async updateInstanceClient<R, C>(
        inst: ServiceInstance<R, C>,
        instanceName: string,
        service: Service<R, C>,
    ): Promise<Result<void>> {
        const oldClient = inst.client;

        if (inst.config === undefined && !service.requiresNoConfig) {
            // No config has been set, therefore the service isn't ready and we can't create a client.
            inst.client = undefined;
        } else {
            try {
                // Create a client using the new config

                // If the service requires a config we make the undefined check above which ensures that undefined doesn't
                // get passed to the createClient function of the service.
                // If the service does not require a config we can safely ignore the undefined error because in that case
                // passing undefined is the intended behavior.
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const client = await service.createClient(inst.config!);

                // Check if a error happened while creating the client
                if (client.failed) {
                    throw client.errorMessage; // Error logging happens in catch block
                } else {
                    // Update service instance object
                    inst.client = client.result;
                }
            } catch (err) {
                const msg = `The "${inst.serviceType}" service produced an error while creating a client: ${err}`;
                this.nodecg.log.error(msg);
                inst.client = undefined;
                return error(msg);
            }
        }

        // Update client of bundles using this instance
        this.bundles.handleInstanceUpdate(inst, instanceName);

        // Stop old client, as it isn't used by any bundle anymore.
        if (oldClient !== undefined) {
            this.nodecg.log.info(`Stopping old unused ${inst.serviceType} client...`);
            try {
                service.stopClient(oldClient);
            } catch (e) {
                this.nodecg.log.error(`Couldn't stop service instance: ${e}`);
            }
        }

        return emptySuccess();
    }

    /**
     * Removes all handlers from the service client of the instance and lets bundles readd their handlers.
     * @param instanceName the name of the instance which handlers should be re-registered
     */
    private reregisterHandlersOfInstance(instanceName?: string): void {
        if (!instanceName) return;

        const inst = this.getServiceInstance(instanceName);
        if (!inst) {
            this.nodecg.log.error(`Can't re-register handlers of instance "${instanceName}": instance not found`);
            return;
        }

        const svc = this.services.getService(inst.serviceType);
        if (svc.failed) {
            this.nodecg.log.error(
                `Can't re-register handlers of instance "${instanceName}": can't get service: ${svc.errorMessage}`,
            );
            return;
        }

        // Client should be recreated because the Service has no way to reset the handlers.
        if (svc.result.reCreateClientToRemoveHandlers) {
            this.updateInstanceClient(inst, instanceName, svc.result);
            return;
        }

        if (!svc.result.removeHandlers) return; // Service provides no way to remove handlers, thus this service has no handlers

        // Remove handlers
        try {
            svc.result.removeHandlers(inst.client);
        } catch (err) {
            this.nodecg.log.error(
                `Can't re-register handlers of instance "${instanceName}": error while removing handlers: ${String(
                    err,
                )}`,
            );
        }
        // Readd handlers by running the `onAvailable` function of all bundles
        // that are using this service instance.
        this.bundles.handleInstanceUpdate(inst, instanceName);
    }
}
