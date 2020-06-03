import { NodeCG } from "nodecg/types/server";
import { ServiceManager } from "./serviceManager";
import { BundleManager } from "./bundleManager";
import { MessageManager } from "./messageManager";
import { InstanceManager } from "./instanceManager";

// TODO: allow bundles to depend on more than one instance of a service type. One solution could be to add a index to ServiceDependency

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

	// FIXME: just for testing, should be removed at some point
	setTimeout(() => {
		ioCore.instanceManager.createServiceInstance("twitch", "someTwitchInstance");
		ioCore.instanceManager.updateInstanceConfig("someTwitchInstance", {
			oauthKey: "Some test value"
		});
	}, 1000);

	return ioCore
};
