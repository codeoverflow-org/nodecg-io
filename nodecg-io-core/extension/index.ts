import { NodeCG } from "nodecg/types/server";
import { ServiceManager } from "./serviceManager";
import { BundleManager } from "./bundleManager";
import { MessageManager } from "./messageManager";

/**
 * Main type of NodeCG extension that the core bundle exposes.
 * Contains references to all internal modules.
 */
export interface NodeCGIOCore {
	serviceManager: ServiceManager
	bundleManager: BundleManager
}

module.exports = (nodecg: NodeCG): NodeCGIOCore => {
	nodecg.log.info("Minzig!");

	const serviceManager = new ServiceManager(nodecg);
	const bundleManager = new BundleManager(nodecg, serviceManager);

	const ioCore: NodeCGIOCore = {
		serviceManager: serviceManager,
		bundleManager: bundleManager
	};

	MessageManager.registerMessageHandlers(nodecg, ioCore);

	// FIXME: just for testing, should be removed at some point
	setTimeout(() => {
		ioCore.serviceManager.createServiceInstance("twitch", "someTwitchInstance");
		ioCore.serviceManager.updateInstanceConfig("someTwitchInstance", {
			oauthKey: "Some test value"
		});
	}, 1000);

	return ioCore
};
