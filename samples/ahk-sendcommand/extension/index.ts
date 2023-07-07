import NodeCG from "@nodecg/types";
import { AHKServiceClient } from "nodecg-io-ahk";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG.ServerAPI) {
    nodecg.log.info("Sample bundle for AHK started");

    const ahk = requireService<AHKServiceClient>(nodecg, "ahk");

    ahk?.onAvailable((client) => {
        nodecg.log.info("AHK client has been updated, sending Hello World Command.");

        client.sendCommand("HelloWorld");
    });

    ahk?.onUnavailable(() => nodecg.log.info("AHK client has been unset."));
};
