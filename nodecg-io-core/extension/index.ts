import { NodeCG } from "nodecg/types/server";
import { ServiceManager } from "./serviceManager";
import { BundleManager } from "./bundleManager";
import { MessageManager } from "./messageManager";
import { InstanceManager } from "./instanceManager";
import { Service, ServiceProvider } from "./types";
import { PersistenceManager } from "./persistenceManager";

/**
 * Main type of NodeCG extension that the core bundle exposes.
 * Contains references to all internal modules.
 */
export interface NodeCGIOCore {
    registerService<R, C>(service: Service<R, C>): ServiceProvider<C>;
}

module.exports = (nodecg: NodeCG): NodeCGIOCore => {
    nodecg.log.info("Minzig!");

    const serviceManager = new ServiceManager(nodecg);
    const bundleManager = new BundleManager(nodecg);
    const instanceManager = new InstanceManager(nodecg, serviceManager, bundleManager);
    const persistenceManager = new PersistenceManager(nodecg, instanceManager, bundleManager);

    MessageManager.registerMessageHandlers(nodecg, instanceManager, bundleManager, persistenceManager);

    function onExit(): void {
        // Unset all service instances in all bundles
        const bundles = bundleManager.getBundleDependencies();
        for (const bundleName in bundles) {
            if (bundles[bundleName] !== undefined) {
                bundles[bundleName]?.forEach((bundleDependency) => {
                    // Only unset a service instance if it was set previously
                    if (bundleDependency.serviceInstance !== undefined) {
                        bundleDependency.clientUpdateCallback(undefined);
                    }
                });
            }
        }

        // Call `stopClient` for all service instances
        const instances = instanceManager.getServiceInstances();
        for (const key in instances) {
            if (instances[key] !== undefined) {
                const client = instances[key]?.client;
                const service = serviceManager.getService(instances[key]?.serviceType as string);
                if (!service.failed) {
                    nodecg.log.info(`Stopping service ${key} of type ${service.result.serviceType}.`);
                    try {
                        service.result.stopClient(client);
                    } catch (err) {
                        nodecg.log.info(
                            `Could not stop service ${key} of type ${service.result.serviceType}: ${String(err)}`,
                        );
                    }
                }
            }
        }
    }

    // Normal exit
    process.on("exit", onExit);
    // Ctrl + C
    process.on("SIGINT", onExit);
    // kill
    process.on("SIGTERM", onExit);
    // nodemon
    process.once("SIGUSR1", () => {
        onExit();
        process.kill(process.pid, "SIGUSR1");
    });
    process.once("SIGUSR2", () => {
        onExit();
        process.kill(process.pid, "SIGUSR2");
    });
    // Uncaught exception
    process.on("uncaughtException", onExit);
    process.on("unhandledRejection", onExit);

    // We use a extra object instead of returning a object containing all the managers and so on, because
    // any loaded bundle would be able to call any (public or private) of the managers which is not intended.
    return {
        registerService<R, C>(service: Service<R, C>): ServiceProvider<C> {
            serviceManager.registerService(service);
            return bundleManager.createServiceProvider(service);
        },
    };
};
