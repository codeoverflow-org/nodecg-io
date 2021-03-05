import { NodeCG } from "nodecg/types/server";
import { DebugHelper } from "nodecg-io-debug";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for the debug service started.");

    const debug = requireService<DebugHelper>(nodecg, "debug");

    debug?.onAvailable((debug) => {
        nodecg.log.info("Debug service available.");
        debug.on("message", (value) => {
            nodecg.log.info(`Received in 'on':  ${value}`);
        });
        debug.onMessage((value) => {
            nodecg.log.info(`Received in 'onMessage':  ${value}`);
        });
    });

    debug?.onUnavailable(() => {
        nodecg.log.info("Debug service unavailable.");
    });
};
