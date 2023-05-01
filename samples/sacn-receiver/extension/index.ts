import NodeCG from "@nodecg/types";
import { SacnReceiverServiceClient } from "nodecg-io-sacn-receiver";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG.ServerAPI) {
    nodecg.log.info("Sample bundle for sACN started");

    const sacn = requireService<SacnReceiverServiceClient>(nodecg, "sacn-receiver");

    sacn?.onAvailable((client) => {
        nodecg.log.info("sACN receiver has been updated, adding handlers for data.");
        addListeners(nodecg, client);
    });

    sacn?.onUnavailable(() => nodecg.log.info("sACN receiver has been unset."));
};

function addListeners(nodecg: NodeCG.ServerAPI, client: SacnReceiverServiceClient) {
    nodecg.log.info("Listening to these universes: " + client.universes);
    client.onPacket((packet) => {
        nodecg.log.info("Received sACN data: " + packet);
    });
}
