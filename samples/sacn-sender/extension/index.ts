import NodeCG from "@nodecg/types";
import { requireService } from "nodecg-io-core";
import { SacnSenderServiceClient } from "nodecg-io-sacn-sender";

module.exports = function (nodecg: NodeCG.ServerAPI) {
    nodecg.log.info("Sample bundle for sacn-sender started");

    const service = requireService<SacnSenderServiceClient>(nodecg, "sacn-sender");
    service?.onAvailable((client) => {
        nodecg.log.info("sACN sender has been updated, setting up interval for sending payloads.");

        setInterval(() => {
            const channel = Math.round(Math.random() * 512).toString();
            const value = Math.round(Math.random() * 100);
            const payload = {
                [channel]: value,
            };
            nodecg.log.info("Sending " + value + " to channel #" + channel);
            client.sendPayload(payload);
        }, 10000);
    });

    service?.onUnavailable(() => nodecg.log.info("sACN sender has been unset."));
};
