import { NodeCG } from "nodecg/types/server";
import { ServiceManager } from "./serviceManager";
import { BundleManager } from "./bundleManager";

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

	return {
		serviceManager: serviceManager,
		bundleManager: bundleManager
	};
};
