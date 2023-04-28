import NodeCG from "@nodecg/types";
import { requireService } from "nodecg-io-core";
import { WSClientServiceClient } from "nodecg-io-websocket-client";

module.exports = function (nodecg: NodeCG.ServerAPI) {
    nodecg.log.info("Sample bundle for websocket-client started");

    const service = requireService<WSClientServiceClient>(nodecg, "websocket-client");
    let interval: NodeJS.Timeout | undefined;

    service?.onAvailable((client) => {
        nodecg.log.info("Client has been updated, waiting for messages.");

        client.onMessage((message) => {
            nodecg.log.info(`recieved message "${message}"`);
        });
        interval = setInterval(() => {
            nodecg.log.info("Sending ping ...");
            client.send("ping");
        }, 10000);
    });

    service?.onUnavailable(() => {
        nodecg.log.info("Client has been unset.");
        if (interval) {
            clearInterval(interval);
        }
    });
};
