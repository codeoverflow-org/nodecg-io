import { Service } from "./types";
import { NodeCG, ReplicantServer } from "nodecg/types/server";
import { error, Result, success } from "./utils/result";

/**
 * Manages services by allowing services to register them and allowing access of other components to the registered services.
 */
export class ServiceManager {
    private services: ReplicantServer<Service<unknown, unknown>[]>;

    constructor(private readonly nodecg: NodeCG) {
        this.services = this.nodecg.Replicant("services", {
            persistent: false, defaultValue: []
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
     * Returns all registered services.
     */
    getServices(): Service<unknown, unknown>[] {
        return this.services.value;
    }

    /**
     * Returns the service with the passed name.
     * @param serviceName The name of the service you want to get.
     * @return the service or undefined if no service with this name has been registered.
     */
    getService(serviceName: string): Result<Service<unknown, unknown>> {
        const svc = this.services.value.find(svc => svc.serviceType === serviceName);
        if (svc === undefined) {
            return error("Service hasn't been registered.");
        } else {
            return success(svc);
        }
    }
}
