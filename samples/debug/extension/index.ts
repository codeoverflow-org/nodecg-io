import { NodeCG } from "nodecg/types/server";
import { DebugHelper } from "nodecg-io-debug";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for the debug service started.");

    const debug = requireService<DebugHelper>(nodecg, "debug");

    debug?.onAvailable((debug) => {
        nodecg.log.info("Debug service available.");

        debug.onClick(() => {
            nodecg.log.info(`Received in 'onClick'`);
        });

        debug.onNumber((value) => {
            nodecg.log.info(`Received in 'onNumber' with number: ${value}`);
        });

        debug.onRange0to100((value) => {
            nodecg.log.info(`Received in 'onRange0to100' with value: ${value}`);
        });

        debug.onColor((value) => {
            nodecg.log.info(`Received in 'onColor' with [red,green,blue]: [${value.red},${value.green},${value.blue}]`);
        });
    });

    debug?.onUnavailable(() => {
        nodecg.log.info("Debug service unavailable.");
    });
};
