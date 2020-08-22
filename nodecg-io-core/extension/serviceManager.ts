import { Service, ServiceClient } from "./types";
import { NodeCG } from "nodecg/types/server";
import { error, Result, success } from "./utils/result";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Manages services by allowing services to register them and allowing access of other components to the registered services.
 */
export class ServiceManager {
    private services: Service<unknown, any>[] = [];

    constructor(private readonly nodecg: NodeCG) {}

    /**
     * Registers the passed service which show it in the GUI and allows it to be instanced using {@link createServiceInstance}.
     * @param service the service you want to register.
     */
    registerService<R, C extends ServiceClient<unknown>>(service: Service<R, C>): void {
        this.services.push(service);
        this.nodecg.log.info(`Service ${service.serviceType} has been registered.`);
    }

    /**
     * Returns all registered services.
     */
    getServices(): Service<unknown, any>[] {
        return this.services;
    }

    /**
     * Returns the service with the passed name.
     * @param serviceName The name of the service you want to get.
     * @return the service or undefined if no service with this name has been registered.
     */
    getService(serviceName: string): Result<Service<unknown, any>> {
        const svc = this.services.find((svc) => svc.serviceType === serviceName);
        if (svc === undefined) {
            return error("Service hasn't been registered.");
        } else {
            return success(svc);
        }
    }
}
