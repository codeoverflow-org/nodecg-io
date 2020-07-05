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

    // We use a extra object instead of returning a object containing all the managers and so on, because
    // any loaded bundle would be able to call any (public or private) of the managers which is not intended.
    return {
        registerService<R, C>(service: Service<R, C>): ServiceProvider<C> {
            serviceManager.registerService(service);
            return bundleManager.createServiceProvider(service);
        },
    };
};
