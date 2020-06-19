import { NodeCG, ReplicantServer } from "nodecg/types/server";
import { ObjectMap, Service, ServiceInstance } from "./types";
import { emptySuccess, error, Result } from "./utils/result";
import { ServiceManager } from "./serviceManager";
import { BundleManager } from "./bundleManager";
import * as Ajv from "ajv";

/**
 * Manages instances of services and their configs/clients.
 */
export class InstanceManager {
    private serviceInstances: ReplicantServer<ObjectMap<string, ServiceInstance<unknown, unknown>>>;
    private ajv = new Ajv();

    constructor(
        private readonly nodecg: NodeCG,
        private readonly services: ServiceManager,
        private readonly bundles: BundleManager,
    ) {
        this.serviceInstances = this.nodecg.Replicant("serviceInstances", {
            persistent: false,
            defaultValue: {},
        });
    }

    /**
     * Finds and returns the service instance with the passed name if it exists.
     * @param instanceName the name of the instance you want to get.
     * @return the wanted service instance if it has been found, undefined otherwise.
     */
    getServiceInstance(instanceName: string): ServiceInstance<unknown, unknown> | undefined {
        return this.serviceInstances.value[instanceName];
    }

    /**
     * Returns all existing service instances.
     * @return {ObjectMap<string, ServiceInstance<unknown, unknown>>} a map of the instance name to the instance.
     */
    getServiceInstances(): ObjectMap<string, ServiceInstance<unknown, unknown>> {
        return this.serviceInstances.value;
    }

    /**
     * Registers a handler that will get called whenever something about a service instance has been changed.
     */
    onInstanceUpdates(callback: () => void): void {
        this.serviceInstances.on("change", callback);
    }

    /**
     * Creates a service instance of the passed service.
     * @param serviceType the type of the service of which a instance should be created
     * @param instanceName how the instance should be named
     * @return void if everything went fine and a string describing the issue if not
     */
    createServiceInstance(serviceType: string, instanceName: string): Result<void> {
        // Check if a instance with the same name already exists.
        if (this.serviceInstances.value[instanceName] !== undefined) {
            return error("A service instance with the same name already exists.");
        }

        // Get service
        const svcResult = this.services.getService(serviceType);
        if (svcResult.failed) {
            return error("A service of this service type hasn't been registered.");
        }
        const service = svcResult.result;

        // Create actual instance and save it
        this.serviceInstances.value[instanceName] = {
            serviceType: service.serviceType,
            config: service.defaultConfig,
            client: undefined,
        };

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
        // TODO: handle if a bundle is still connected to this instance, remove this instance from those bundle or don't allow deleting
        // Removing it from the list
        return delete this.serviceInstances.value[instanceName];
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
    async updateInstanceConfig(
        instanceName: string,
        config: unknown,
        validation: boolean = true,
    ): Promise<Result<void>> {
        // Check existence and get service instance.
        const inst = this.serviceInstances.value[instanceName];
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
            const validationRes = await service.result.validateConfig(config);
            if (validationRes.failed) {
                return error("Config invalid: " + validationRes.errorMessage);
            }
        }

        // All checks passed. Set config.
        inst.config = config;

        // Update client of this instance using the new config.
        await this.updateInstanceClient(inst, instanceName, service.result);

        return emptySuccess();
    }

    /**
     * Updates the client of a service instance by calling the underlying service to generate a new client
     * using the new config and also let all bundle depending on it update their client.
     * @param inst the instance of which the client should be generated.
     * @param instanceName the name of the service instance, used for letting all bundles know of the new client.
     * @param service the service of the service instance, needed to stop old client
     */
    private async updateInstanceClient<R>(
        inst: ServiceInstance<R, unknown>,
        instanceName: string,
        service: Service<R, unknown>,
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

            const client = await service.result.createClient(inst.config);

            // Check if a error happened while creating the client
            if (client.failed) {
                this.nodecg.log.error(
                    `The "${inst.serviceType}" service produced an error while creating a client: ${client.errorMessage}`,
                );
                inst.client = undefined;
            } else {
                // Update service instance object
                inst.client = client.result;
            }
        }

        // Update client of bundles using this instance
        this.bundles.handleInstanceUpdate(inst, instanceName);

        // Stop old client, as it isn't used by any bundle anymore.
        if (oldClient !== undefined) {
            service.stopClient(oldClient);
        }
    }
}
