import { NodeCG } from "nodecg-types/types/server";
import { ObjectMap, Service, ServiceDependency, ServiceInstance } from "./service";
import { emptySuccess, error, Result } from "./utils/result";
import { EventEmitter } from "events";
import { ServiceProvider } from "./serviceProvider";

/**
 * Manages bundles and their dependencies on nodecg-io services.
 */
export class BundleManager extends EventEmitter {
    // Object that maps a bundle name to the array that contains all services that this bundle depends upon
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
     * @return a {@link ServiceProvider} that allows the bundle to access the service client, if a service instance is set
     * and there were no errors in the client creation.
     */
    registerServiceDependency<C>(bundleName: string, service: Service<unknown, C>): ServiceProvider<C> | undefined {
        // Get current service dependencies or an empty array if none
        const serviceDependencies = this.bundles[bundleName] ?? [];

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
            serviceInstance: undefined,
            provider,
        });

        // Save update dependencies array.
        this.bundles[bundleName] = serviceDependencies;
        this.emit("change");
        this.nodecg.log.info(
            `Bundle "${bundleName}" has registered a dependency on the service "${service.serviceType}"`,
        );
        return provider;
    }

    /**
     * Assigns a service instance to the service dependency of a bundle and gives the bundle access to the current
     * service client. Future client updates will be handled through {@link BundleManager.handleInstanceUpdate}.
     * @param bundleName the name of the bundle that has the dependency on the service.
     * @param instanceName the name of the service instance that should be used to satisfy the dependency of the bundle.
     * @param instance the service instance object that should be used to satisfy the dependency of the bundle.
     */
    setServiceDependency(
        bundleName: string,
        instanceName: string,
        instance: ServiceInstance<unknown, unknown>,
    ): Result<void> {
        // Check that bundle exists and get its service dependencies
        const bundle = this.bundles[bundleName];
        if (bundle === undefined) {
            return error(`Bundle "${bundleName}" couldn't be found.`);
        }

        // Get the service dependency that manages dependence for this service type
        const svcDependency = bundle.find((svcDep) => svcDep.serviceType === instance.serviceType);
        if (svcDependency === undefined) {
            return error(`Bundle "${bundleName} doesn't depend on the "${instance.serviceType}" service.`);
        }
        const oldInstance = svcDependency.serviceInstance;

        // Assign service instance to the service dependency of this bundle
        svcDependency.serviceInstance = instanceName;

        // Let the bundle update its reference to the client
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

            // Unset service instance and let the bundle know that it hasn't access to this service any more.
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
        Object.entries(this.bundles).forEach(([_bundleName, svcDependencies]) => {
            // If they have this instance set somewhere in their dependencies then update the bundle.
            svcDependencies.forEach((dep) => {
                if (dep.serviceInstance === instName) {
                    dep.provider.updateClient(serviceInstance.client);
                }
            });
        });
    }
}
