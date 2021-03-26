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

        debug.onDate((value) => {
            nodecg.log.info(`Received in 'onDate' with date: ${value}`);
        });

        debug.onBool((value) => {
            nodecg.log.info(`Received in 'onBool' with boolean: ${value}`);
        });

        debug.onText((value) => {
            nodecg.log.info(`Received in 'onText' with string: ${value}`);
        });

        debug.onList((value) => {
            nodecg.log.info(`Received in 'onList' with entries: [${value.join(",")}]`);
        });

        debug.onJSON((value) => {
            nodecg.log.info(`Received in 'onJSON' with JSON: ${value}`);
        });
    });

    debug?.onUnavailable(() => {
        nodecg.log.info("Debug service unavailable.");
    });
};
