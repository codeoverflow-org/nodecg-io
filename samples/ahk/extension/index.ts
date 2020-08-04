import { NodeCG } from "nodecg/types/server";
import { AHKServiceClient } from "nodecg-io-ahk/extension";
import { requireService } from "nodecg-io-core/extension/serviceClientWrapper";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for AHK started");

    const ahk = requireService<AHKServiceClient>(nodecg, "ahk");

    ahk?.onAvailable((client) => {
        nodecg.log.info("AHK client has been updated, sending Hello World Command.");

        client.getRawClient().sendCommand("HelloWorld");
    });

    ahk?.onUnavailable(() => nodecg.log.info("AHK client has been unset."));
};
