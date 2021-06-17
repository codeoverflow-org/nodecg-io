import { NodeCG } from "nodecg/types/server";
import { ObjectMap, Service, ServiceDependency, ServiceInstance } from "./service";
import { emptySuccess, error, Result } from "./utils/result";
import { EventEmitter } from "events";
import { ServiceProvider } from "./serviceProvider";

/**
 * Manages bundles and their dependencies on nodecg-io services.
 */
export class BundleManager extends EventEmitter {
    private readonly bundles: ObjectMap<ServiceDependency<unknown>[]> = {};

    constructor(private readonly nodecg: NodeCG) {
        super();
    }

    /**
     * Gets all bundle dependencies
     * @return {ObjectMap<ServiceDependency<unknown>[]>} all bundle dependencies
     */
    getBundleDependencies(): ObjectMap<ServiceDependency<unknown>[]> {
        return this.bundles;
    }

    /**
     * Registers that a bundle has a dependency on a specific service.
     * @param bundleName the name of the bundle that registers its dependency.
     * @param service the service that the bundle depends upon.
     * @param clientUpdate the callback that should be called if a client becomes available or gets updated.
     */
    registerServiceDependency<C>(bundleName: string, service: Service<unknown, C>): ServiceProvider<C> | undefined {
        // Get current service dependencies or an empty array if none
        const serviceDependencies = this.bundles[bundleName] || [];

        // Check if the same type of dependency is already registered
        if (serviceDependencies.find((sd) => sd.serviceType === service.serviceType)) {
            this.nodecg.log.info(
                `Bundle "${bundleName}" has registered a dependency to the service "${service.serviceType}" more than once!`,
            );
            return;
        }

        const provider = new ServiceProvider<C>();

        // Create and add dependency on this service
        serviceDependencies.push({
            serviceType: service.serviceType,
            serviceInstance: undefined, // User has to create a service instance and then set it in the gui
            provider,
        });

        // Save new dependencies.
        this.bundles[bundleName] = serviceDependencies;
        this.emit("change");
        this.nodecg.log.info(
            `Bundle "${bundleName}" has registered a dependency on the service "${service.serviceType}"`,
        );
        return provider;
    }

    /**
     * Satisfies a service dependency by providing a service instance of the type and connects the bundle and service together.
     * @param bundleName the name of the bundle that has the dependency on the service.
     * @param instanceName the name of the service instance that should be used to satisfy the dependency of the bundle.
     * @param instance the service instance object that should be used to satisfy the dependency of the bundle.
     * @return void if successful and a string explain what went wrong otherwise
     */
    setServiceDependency(
        bundleName: string,
        instanceName: string,
        instance: ServiceInstance<unknown, unknown>,
    ): Result<void> {
        // Check that bundle exists and get service dependencies
        const bundle = this.bundles[bundleName];
        if (bundle === undefined) {
            return error(`Bundle "${bundleName}" couldn't be found.`);
        }

        // Check that the bundle actually depends on this type of service
        const svcDependency = bundle.find((svcDep) => svcDep.serviceType === instance.serviceType);
        if (svcDependency === undefined) {
            return error(`Bundle "${bundleName} doesn't depend on the "${instance.serviceType}" service.`);
        }
        const oldInstance = svcDependency.serviceInstance;

        // Update service instance of service dependency, remove client update callback from old service instance (if applicable)
        // and add the callback to the new instance.
        svcDependency.serviceInstance = instanceName;

        // Let the bundle update his reference to the client
        svcDependency.provider.updateClient(instance.client);

        this.emit("change");
        this.emit("reregisterInstance", oldInstance);
        return emptySuccess();
    }

    /**
     * Unsets a service dependency of any service instance. Removes the connection between the bundle and the service instance.
     * @param bundleName the bundle of which the service instance should be unset.
     * @param serviceType the service type of which the service instance that should be unset
     * @return a boolean indicating if the operation was successful of if the service instance of the service dependency
     *         was already unset.
     */
    unsetServiceDependency(bundleName: string, serviceType: string): boolean {
        // Get service dependency of given bundle
        const bundle = this.bundles[bundleName];
        const svcDependency = bundle?.find((svcDep) => svcDep.serviceType === serviceType);

        if (svcDependency !== undefined) {
            const oldInstance = svcDependency.serviceInstance;

            // Unset service instance and let the bundle know that it hasn't access to this service anymore.
            svcDependency.serviceInstance = undefined;
            svcDependency.provider.updateClient(undefined);

            this.emit("change");
            this.emit("reregisterInstance", oldInstance);

            return true;
        }

        return false;
    }

    /**
     * Handles client updates of service instances and distributes them to all bundles that depend upon this service
     * and have this service instance set.
     * @param serviceInstance the service instance of which the client has been updated
     * @param instName the name of the service instance
     */
    handleInstanceUpdate(serviceInstance: ServiceInstance<unknown, unknown>, instName: string): void {
        // Iterate over all bundles
        for (const bundle in this.bundles) {
            if (!Object.prototype.hasOwnProperty.call(this.bundles, bundle)) {
                continue;
            }
            // Get their dependencies and if they have this instance set somewhere then update the bundle.
            const dependencies = this.bundles[bundle];
            dependencies?.forEach((dep) => {
                if (dep.serviceInstance === instName) {
                    dep.provider.updateClient(serviceInstance.client);
                }
            });
        }
    }
}
