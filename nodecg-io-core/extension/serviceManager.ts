import { ObjectMap, Service, ServiceInstance } from "./types";
import { NodeCG, ReplicantServer } from "nodecg/types/server";
import { emptySuccess, error, Result } from "./utils/result";

/**
 * Manages services and service instances.
 */
export class ServiceManager {
    private services: ReplicantServer<Service<unknown, unknown>[]>;
    private serviceInstances: ReplicantServer<ObjectMap<string, ServiceInstance<unknown, unknown>>>;
    private clientUpdateCallback: (inst: ServiceInstance<unknown, unknown>, instName: string) => void = () => {};

    constructor(private readonly nodecg: NodeCG) {
        this.services = this.nodecg.Replicant("services", {
            persistent: false, defaultValue: []
        });
        this.serviceInstances = this.nodecg.Replicant("serviceInstances", {
            persistent: false, defaultValue: {}
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
        return this.serviceInstances.value[instanceName];
    }

    /**
     * Creates a service instance of the passed service.
     * @param service the service of which a instance should be created
     * @param instanceName how the instance should be naemd
     * @return void if everything went fine and a string describing the issue if not
     */
    createServiceInstance<R, C>(service: Service<R, C>, instanceName: string): Result<void> {
        // Check if a instance with the same name already exists.
        if (this.serviceInstances.value[instanceName] !== undefined) {
            return error("A service instance with the same name already exists.");
        }

        // Create actual instance and save it
        this.serviceInstances.value[instanceName] = {
            serviceType: service.serviceType,
            config: service.defaultConfig,
            client: undefined
        };

        this.nodecg.log.info(`Service instance "${instanceName}" of service "${service.serviceType}" has been sucessfully created.`);
        return emptySuccess();
    }

    setClientUpdateCallback(callback: (inst: ServiceInstance<unknown, unknown>, instName: string) => void): void {
        this.clientUpdateCallback = callback;
    }

    /**
     * Deletes a service instance with the passed name.
     * @param instanceName the name of the service instance that should be deleted.
     * @return true if it has been found and deleted, false if it couldn't been found.
     */
    private deleteServiceInstance(instanceName: string): boolean {
        // Disables any currently running listeners
        const inst = this.serviceInstances.value[instanceName];
        if (inst === undefined) {
            return false;
        }

        // TODO: handle if a bundle is still connected to this instance, remove this instance from those bundle or don't allow deleting

        // Removing it from the list
        this.serviceInstances.value[instanceName] = undefined;
        return true;
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
        // Check existence and get service instance.
        const inst = this.serviceInstances.value[instanceName];
        if (inst === undefined) {
            return error("Service instance doesn't exist.");
        }

        // TODO: Validate JSON Schema

        // Validation by the service.
        const validationRes = this.getService(inst.serviceType).validateConfig(config);
        if (validationRes.failed) {
            return error("Config invalid: " + validationRes.errorMessage);
        }

        // All checks passed. Set config.
        inst.config = config;

        // Update client of this instance using the new config.
        this.updateInstanceClient(inst, instanceName);

        return emptySuccess();
    }

    /**
     * Updates the client of a service instance by calling the underlying service to generate a new client
     * using the new config and also let all bundle depending on it update their client.
     * @param inst the instance of which the client should be generated.
     * @param instanceName the name of the service instance, used for letting all bundles know of the new client.
     */
    private updateInstanceClient<R>(inst: ServiceInstance<R, unknown>, instanceName: string): void {
        if (inst.config === undefined) {
            // No config has been set, therefore the service isn't ready and we can't create a client.
            inst.client = undefined;
            return;
        } else {
            // Create a client using the new config
            const clientRes = this.getService(inst.serviceType).createClient(inst.config);

            // Check if a error happened while creating the client
            if (clientRes.failed) {
                this.nodecg.log.error(`The "${inst.serviceType}" service produced an error while creating a client: ${clientRes.errorMessage}`);
            } else {
                // Update service instance object
                inst.client = clientRes.result;
            }
        }

        // Let all bundles that depend upon this instance known of the new client.
        this.clientUpdateCallback(inst, instanceName);
    }

    private getService(svcType: string): Service<unknown, unknown> {
        return this.services.value.find(svc => svc.serviceType == svcType)!;
    }
}
