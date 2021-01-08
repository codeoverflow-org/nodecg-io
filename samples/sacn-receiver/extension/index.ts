import { NodeCG } from "nodecg/types/server";
import { SacnReceiverServiceClient } from "nodecg-io-sacn-receiver";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for sACN started");

    const sacn = requireService<SacnReceiverServiceClient>(nodecg, "sacn-receiver");

    sacn?.onAvailable((client) => {
        nodecg.log.info("sACN sample has been updated, adding handlers for data.");
        addListeners(nodecg, client);
    });

    sacn?.onUnavailable(() => nodecg.log.info("sACN sample has been unset."));
};

function addListeners(nodecg: NodeCG, client: SacnReceiverServiceClient) {
    nodecg.log.info("Listening to these universes: " + client.getNativeClient().universes);
    client.onPacket((packet) => {
        nodecg.log.info("Received sACN data: " + packet);
    });
}
