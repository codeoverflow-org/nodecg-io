import { NodeCG } from "nodecg/types/server";
import { ObjectMap, Service, ServiceClient, ServiceInstance } from "./types";
import { emptySuccess, error, Result } from "./utils/result";
import { ServiceManager } from "./serviceManager";
import { BundleManager } from "./bundleManager";
import * as Ajv from "ajv";
import { EventEmitter } from "events";

/**
 * Manages instances of services and their configs/clients.
 */
export class InstanceManager extends EventEmitter {
    private serviceInstances: ObjectMap<string, ServiceInstance<unknown, unknown>> = {};
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
     * @return {ObjectMap<string, ServiceInstance<unknown, unknown>>} a map of the instance name to the instance.
     */
    getServiceInstances(): ObjectMap<string, ServiceInstance<unknown, unknown>> {
        return this.serviceInstances;
    }

    /**
     * Creates a service instance of the passed service.
     * @param serviceType the type of the service of which a instance should be created
     * @param instanceName how the instance should be named
     * @return void if everything went fine and a string describing the issue if not
     */
    createServiceInstance(serviceType: string, instanceName: string): Result<void> {
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
        this.serviceInstances[instanceName] = {
            serviceType: service.serviceType,
            config: service.defaultConfig,
            client: undefined,
        };
        this.emit("change");

        this.nodecg.log.info(
            `Service instance "${instanceName}" of service "${service.serviceType}" has been successfully created.`,
        );
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
                this.nodecg.log.info(`Sucessfully stopped client of service instance "${instanceName}".`);
                try {
                    svc.result.stopClient(instance.client);
                } catch (e) {
                    this.nodecg.log.error(`Couldn't stop service instance: ${e}`);
                }
            }
        }

        delete this.serviceInstances[instanceName];
        // Save deletion
        this.emit("change");

        // Remove any assignment of a bundle to this service instance
        const deps = this.bundles.getBundleDependencies();
        for (const bundle in deps) {
            if (!Object.prototype.hasOwnProperty.call(deps, bundle)) {
                continue;
            }

            deps[bundle]
                ?.filter((d) => d.serviceInstance === instanceName) // Search for bundle dependencies using this instance
                .forEach((d) => this.bundles.unsetServiceDependency(bundle, d.serviceType)); // unset all these
        }
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
    async updateInstanceConfig(instanceName: string, config: unknown, validation = true): Promise<Result<void>> {
        // Check existence and get service instance.
        const inst = this.serviceInstances[instanceName];
        if (inst === undefined) {
            return error("Service instance doesn't exist.");
        }

        const service = this.services.getService(inst.serviceType);
        if (service.failed) {
            return error("The service of this instance couldn't be found.");
        }

        if (validation) {
            const schemaValid = this.ajv.validate(service.result.schema, config);
            if (!schemaValid) {
                return error("Config invalid: " + this.ajv.errorsText());
            }

            // Validation by the service.
            try {
                const validationRes = await service.result.validateConfig(config);
                if (validationRes.failed) {
                    return error("Config invalid: " + validationRes.errorMessage);
                }
            } catch (err) {
                return error("Config invalid: " + err);
            }
        }

        // All checks passed. Set config.
        inst.config = config;

        // Update client of this instance using the new config.
        await this.updateInstanceClient(inst, instanceName, service.result);

        this.emit("change");
        return emptySuccess();
    }

    /**
     * Updates the client of a service instance by calling the underlying service to generate a new client
     * using the new config and also let all bundle depending on it update their client.
     * @param inst the instance of which the client should be generated.
     * @param instanceName the name of the service instance, used for letting all bundles know of the new client.
     * @param service the service of the service instance, needed to stop old client
     */
    private async updateInstanceClient<R, C extends ServiceClient<unknown>>(
        inst: ServiceInstance<R, C>,
        instanceName: string,
        service: Service<R, C>,
    ): Promise<void> {
        const oldClient = inst.client;

        if (inst.config === undefined) {
            // No config has been set, therefore the service isn't ready and we can't create a client.
            inst.client = undefined;
        } else {
            // Create a client using the new config
            const service = this.services.getService(inst.serviceType);
            if (service.failed) {
                inst.client = undefined;
                return;
            }

            try {
                const client = await service.result.createClient(inst.config);

                // Check if a error happened while creating the client
                if (client.failed) {
                    throw client.errorMessage; // Error logging happens in catch block
                } else {
                    // Update service instance object
                    inst.client = client.result;
                }
            } catch (err) {
                this.nodecg.log.error(
                    `The "${inst.serviceType}" service produced an error while creating a client: ${err}`,
                );
                inst.client = undefined;
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
    }

    /**
     * Removes all handlers from the service client of the instance and lets bundles readd their handlers.
     * @param instanceName the name of the instance which handlers should be re-registred
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
                `Can't reregister handlers of instance "${instanceName}": can't get service: ${svc.errorMessage}`,
            );
            return;
        }

        if (!svc.result.removeHandlers) return; // Service provides no way to remove handlers, thus this service has no handlers

        // Remove handlers
        try {
            svc.result.removeHandlers(inst.client);
        } catch (err) {
            this.nodecg.log.error(
                `Can't re-register handlers of instance "${instanceName}": error while removing handlers: ${err.toString()}`,
            );
        }
        // Readd handlers by running the `onAvailable` function of all bundles
        // that are using this service instance.
        this.bundles.handleInstanceUpdate(inst, instanceName);
    }
}
