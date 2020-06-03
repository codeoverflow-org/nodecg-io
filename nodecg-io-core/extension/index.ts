import { NodeCG } from "nodecg/types/server";
import { ServiceManager } from "./serviceManager";
import { BundleManager } from "./bundleManager";
import { MessageManager } from "./messageManager";
import { InstanceManager } from "./instanceManager";

// TODO: allow bundles to depend on more than one instance of a service type. One solution could be to add a index to ServiceDependency
// TODO: Clients need have a stop function to e.g. disconnect from remote servers

/**
 * Main type of NodeCG extension that the core bundle exposes.
 * Contains references to all internal modules.
 */
export interface NodeCGIOCore {
	serviceManager: ServiceManager
	instanceManager: InstanceManager
	bundleManager: BundleManager
}

module.exports = (nodecg: NodeCG): NodeCGIOCore => {
	nodecg.log.info("Minzig!");

	const serviceManager = new ServiceManager(nodecg);
	const instanceManager = new InstanceManager(nodecg, serviceManager)
	const bundleManager = new BundleManager(nodecg);

	const ioCore: NodeCGIOCore = {
		serviceManager: serviceManager,
		instanceManager: instanceManager,
		bundleManager: bundleManager
	};

	MessageManager.registerMessageHandlers(nodecg, ioCore);

	return ioCore
};
