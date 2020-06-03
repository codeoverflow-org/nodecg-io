import { NodeCG, ReplicantServer } from "nodecg/types/server";
import { ObjectMap, Service, ServiceDependency, ServiceInstance, ServiceProvider } from "./types";
import { emptySuccess, error, Result } from "./utils/result";

/**
 * Manages bundles and their dependencies on nodecg-io services.
 */
export class BundleManager {

    private readonly bundles: ReplicantServer<ObjectMap<string, ServiceDependency<unknown>[]>>;

    constructor(private readonly nodecg: NodeCG) {
        this.bundles = this.nodecg.Replicant("bundles", {
            persistent: false, defaultValue: {}
        });
    }

    /**
     * Creates a object which allows bundles to register them for a specific service.
     * Indented to be called by services to allow registering by giving bundles this service provider.
     * Dependencies on the service are registered using {@link registerServiceDependency}
     *
     * @param service the service that the bundle should register for and depend on.
     * @return a service provider which offers a function for bundles to register and depend on the passed service.
     */
    createServiceProvider<C>(service: Service<unknown, C>): ServiceProvider<C> {
        return {
            requireService: (bundleName: string, clientUpdate: (client?: C) => void) => {
                this.registerServiceDependency(bundleName, service, clientUpdate);
            }
        };
    }

    /**
     * Registers that a bundle has a dependency on a specific service.
     * @param bundleName the name of the bundle that registers its dependency.
     * @param service the service that the bundle depends upon.
     * @param clientUpdate the callback that should be called if a client becomes available or gets updated.
     */
    private registerServiceDependency<C>(bundleName: string, service: Service<unknown, C>, clientUpdate: (client?: C) => void): void {
        // Get current service dependencies or an empty array if none
        const serviceDependencies = this.bundles.value[bundleName] || [];

        // Check if the same type of dependency is already registered
        if (serviceDependencies.find(sd => sd.serviceType === service.serviceType)) {
            this.nodecg.log.info(`Bundle "${bundleName}" has registered a dependency to the service "${service.serviceType}" more than once!`);
            return;
        }

        // Create and add dependency on this service
        serviceDependencies.push({
            serviceType: service.serviceType,
            serviceInstance: undefined, // User has to create a service instance and then set it in the gui
            clientUpdateCallback: clientUpdate
        });

        // Save new dependencies.
        this.bundles.value[bundleName] = serviceDependencies;
        this.nodecg.log.info(`Bundle "${bundleName}" has registered a dependency on the service "${service.serviceType}"`);
    }

    /**
     * Satisfies a service dependency by providing a service instance of the type and connects the bundle and service together.
     * @param bundleName the name of the bundle that has the dependency on the service.
     * @param instanceName the name of the service instance that should be used to satisfy the dependency of the bundle.
     * @param instance the service instance object that should be used to satisfy the dependency of the bundle.
     * @return void if successful and a string explain what went wrong otherwise
     */
    setServiceDependency(bundleName: string, instanceName: string, instance: ServiceInstance<unknown, unknown>): Result<void> {
        // Check that bundle exists and get service dependencies
        const bundle = this.bundles.value[bundleName];
        if (bundle === undefined) {
            return error(`Bundle "${bundleName}" couldn't be found.`);
        }

        // Check that the bundle actually depends on this type of service
        const svcDependency = bundle.find(svcDep => svcDep.serviceType === instance.serviceType);
        if (svcDependency === undefined) {
            return error(`Bundle "${bundleName} doesn't depend on the "${instance.serviceType}" service.`);
        }

        // Update service instance of service dependency, remove client update callback from old service instance (if applicable)
        // and add the callback to the new instance.
        svcDependency.serviceInstance = instanceName;

        // Let the bundle update his reference to the client
        svcDependency.clientUpdateCallback(instance.client);
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
        const bundle = this.bundles.value[bundleName];
        const svcDependency = bundle?.find(svcDep => svcDep.serviceType === serviceType);

        if (svcDependency !== undefined) {
            // Unset service instance and let the bundle know that it hasn't access to this service anymore.
            svcDependency.serviceInstance = undefined;
            svcDependency.clientUpdateCallback(undefined);
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
        for (const bundle in this.bundles.value) {
            if(!this.bundles.value.hasOwnProperty(bundle)) {
                continue;
            }
            // Get their dependencies and if they have this instance set somewhere then update the bundle.
            const dependencies = this.bundles.value[bundle];
            dependencies?.forEach((dep) => {
                if(dep.serviceInstance === instName) {
                    dep.clientUpdateCallback(serviceInstance.client)
                }
            });
        }
    }
}
