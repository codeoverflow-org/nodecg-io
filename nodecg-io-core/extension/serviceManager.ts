import { Service, ServiceInstance } from "./types";
import { NodeCG, ReplicantServer } from "nodecg/types/server";
import { emptySuccess, error, Result } from "./utils/result";

/**
 * Manages services and service instances.
 */
export class ServiceManager {
    private services: ReplicantServer<Service<unknown, unknown>[]>;
    private serviceInstances: ReplicantServer<Map<string, ServiceInstance<unknown, unknown>>>;

    constructor(private readonly nodecg: NodeCG) {
        this.services = this.nodecg.Replicant("services", {
            persistent: false, defaultValue: []
        });
        this.serviceInstances = this.nodecg.Replicant("serviceInstances", {
            persistent: false, defaultValue: new Map()
        });
    }

    /**
     * Registers the passed service which show it in the GUI and allows it to be instanced using {@link createServiceInstance}.
     * @param service the service you want to register.
     */
    registerService<R, C>(service: Service<R, C>) {
        this.services.value.push(service);
        this.nodecg.log.info(`Service ${service.serviceType} has been registered.`);
    }

    /**
     * Finds and returns the service instance with the passed name if it exists.
     * @param instanceName the name of the instance you want to get.
     * @return the wanted service instance if it has been found, undefined otherwise.
     */
    getServiceInstance(instanceName: string): ServiceInstance<unknown, unknown> | undefined {
        return this.serviceInstances.value.get(instanceName);
    }

    /**
     * Creates a service instance of the passed service.
     * @param service the service of which a instance should be created
     * @param instanceName how the instance should be naemd
     * @return void if everything went fine and a string describing the issue if not
     */
    createServiceInstance<R, C>(service: Service<R, C>, instanceName: string): Result<void> {
        // Check if a instance with the same name already exists.
        if (this.serviceInstances.value.has(instanceName)) {
            return error("A service instance with the same name already exists.");
        }

        // Create replicants for config and client
        const cfgReplicant = this.nodecg.Replicant<R | undefined>(`serviceInstanceConfig:${service.serviceType}:${instanceName}`, {
            persistent: false,
            schemaPath: service.schemaPath,
            defaultValue: service.defaultConfig
        });

        const clientReplicant = this.nodecg.Replicant<C | undefined>(`serviceInstanceClient:${service.serviceType}:${instanceName}`, {
            persistent: false
        });

        // Create actual instance
        const inst: ServiceInstance<R, C> = {
            service: service,
            config: cfgReplicant,
            client: clientReplicant
        };

        // Create handler that automatically updates the client replicant if the config replicant changes
        inst.config.addListener("change", (newVal: R | undefined, _oldVal: R | undefined) => {
            ServiceManager.configUpdateCallback(inst, newVal);
        });

        // Save instance
        this.serviceInstances.value.set(instanceName, inst);

        this.nodecg.log.info(`Service instance "${instanceName}" of service "${service.serviceType}" has been sucessfully created.`);
        return emptySuccess();
    }

    /**
     * Updates the client of a service instance using the passed config.
     * @param inst the service instance of which the client should be updated
     * @param newCfg the new config
     */
    private static configUpdateCallback<R>(inst: ServiceInstance<R, unknown>, newCfg?: R) {
        if(newCfg === undefined) {
            // No config has been set, therefore the service isn't ready and we can't create a client.
            inst.client.value = undefined;
            return;
        }

        // Create a client using the new config
        const clientRes = inst.service.createClient(newCfg);

        // Check if a error happened while creating the client
        if (clientRes.failed) {
            nodecg.log.error(`The "${inst.service.serviceType}" service produced an error while creating a client: ${clientRes.errorMessage}`);
        } else {
            // Update service instance object
            inst.client.value = clientRes.result;
        }
    }

    /**
     * Deletes a service instance with the passed name.
     * @param instanceName the name of the service instance that should be deleted.
     * @return true if it has been found and delete, false if it couldn't been found.
     */
    private deleteServiceInstance(instanceName: string): boolean {
        // Disables any currently running listeners
        const inst = this.serviceInstances.value.get(instanceName);
        inst?.config.removeAllListeners("change");

        // TODO: what is when a bundle service dependency still contains a reference the service instance?
        return this.serviceInstances.value.delete(instanceName);
    }

    /**
     * Updates the config of a service instance.
     * Before actually setting the new config, it validates it against the json schema of the service and
     * the validate function of the service.
     * @param instanceName the name of the service instance of which the config should be set.
     * @param config the actual config that will be given to the service instance.
     * @return void if everything went fine and a string describing the issue if something went wrong.
     */
    private updateInstanceConfig(instanceName: string, config: unknown): Result<void> {
        // Check existence and get service instance
        const inst = this.serviceInstances.value.get(instanceName);
        if (inst === undefined) {
            return error("Service instance doesn't exist.");
        }

        // Validate JSON Schema
        if (!inst.config.validate(config)) {
            return error("Config invalid: violates provided json schema.");
        }

        // Validation by the service
        const validationRes = inst.service.validateConfig(config);
        if (validationRes.failed) {
            return error("Config invalid: " + validationRes.errorMessage);
        }

        // All checks passed. Set config.
        inst.config.value = config;

        return emptySuccess();
    }
}
