import { ServiceManager } from "./serviceManager";
import { NodeCG, ReplicantServer } from "nodecg/types/server";
import { Service, ServiceDependency, ServiceProvider } from "./types";
import { emptySuccess, error, Result } from "./utils/result";

/**
 * Manages bundles and their dependencies on nodecg-io services.
 */
export class BundleManager {

    private bundles: ReplicantServer<Map<string, ServiceDependency<unknown>[]>>;

    constructor(private readonly nodecg: NodeCG, private readonly serviceManager: ServiceManager) {
        this.bundles = this.nodecg.Replicant("bundles", {
            persistent: false, defaultValue: new Map()
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
            registerBundle: (bundleName: string, clientUpdate: (client?: C) => void) => {
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
    private registerServiceDependency<C>(bundleName: string, service: Service<unknown, C>, clientUpdate: (client?: C) => void) {
        // Get current service dependencies or an empty array if none
        const serviceDependencies = this.bundles.value.has(bundleName) ? this.bundles.value.get(bundleName)! : [];

        // Check if the same type of dependency is already registered
        if (serviceDependencies.find(sd => sd.serviceType === service.serviceType)) {
            nodecg.log.info(`Bundle "${bundleName}" has registered a dependency to the service "${service.serviceType}" more than once!`);
            return;
        }

        // Create and add dependency on this service
        serviceDependencies.push({
            serviceType: service.serviceType,
            serviceInstance: undefined, // User has to create a service instance and then set it in the gui
            clientUpdateCallback: clientUpdate
        });
    }

    /**
     * Satisfies a service dependency by providing a service instance of the type and connects the bundle and service together.
     * @param bundleName the name of the bundle that has the dependency on the service.
     * @param instanceName the name of the service instance that should be used to satisfy the dependency of the bundle.
     * @return void if successful and a string explain what went wrong otherwise
     */
    private setServiceDependency(bundleName: string, instanceName: string): Result<void> {
        // Check that bundle exists and get service dependencies
        const bundle = this.bundles.value.get(bundleName);
        if (bundle === undefined) {
            return error(`Bundle "${bundleName}" couldn't be found.`);
        }

        // Check that the service instance exists and get it
        const serviceInstance = this.serviceManager.getServiceInstance(instanceName);
        if (serviceInstance === undefined) {
            return error(`Service instance "${instanceName}" couldn't be found.`);
        }

        // Check that the bundle actually depends on this type of service
        const svcDependency = bundle.find(svcDep => svcDep.serviceType === serviceInstance.service.serviceType);
        if (svcDependency === undefined) {
            return error(`Bundle "${bundleName} doesn't depend on the "${serviceInstance.service.serviceType}" service.`);
        }

        // Update service instance of service dependency, remove client update callback from old service instance (if applicable)
        // and add the callback to the new instance.
        svcDependency.serviceInstance?.client.removeListener("change", svcDependency.clientUpdateCallback);
        svcDependency.serviceInstance = serviceInstance;
        svcDependency.serviceInstance.client.addListener("change", svcDependency.clientUpdateCallback);

        // Let the bundle update his reference to the client
        svcDependency.clientUpdateCallback(serviceInstance.client.value);
        return emptySuccess();
    }

    /**
     * Unsets a service dependency of any service instance. Removes the connection between the bundle and the service instance.
     * @param bundleName the bundle of which the service instance should be unset.
     * @param serviceType the service type of which the service instance that should be unset
     * @return a boolean indicating if the operation was successful of if the service instance of the service dependency
     *         was already unset.
     */
    private unsetServiceDependency(bundleName: string, serviceType: string): boolean {
        // Get service dependency of given bundle
        const bundle = this.bundles.value.get(bundleName);
        const svcDependency = bundle?.find(svcDep => svcDep.serviceType === serviceType);

        if (svcDependency !== undefined) {
            // Unset service instance including the update callback as the bundle would still have access to
            // the service's clients otherwise
            svcDependency.serviceInstance?.client.removeListener("change", svcDependency.clientUpdateCallback);
            svcDependency.serviceInstance = undefined;
            svcDependency.clientUpdateCallback(undefined); // Say the bundle that it now has no client anymore
            return true;
        }

        return false;
    }
}
