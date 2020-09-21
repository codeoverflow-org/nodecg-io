import { NodeCG } from "nodecg/types/server";
import { requireService } from "nodecg-io-core/extension/serviceClientWrapper";
import { WSClientServiceClient } from "nodecg-io-websocket-client/extension";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for <the-service-name> started");

    const service = requireService<WSClientServiceClient>(nodecg, "websocket-client");
    service?.onAvailable((client) => {
        nodecg.log.info("Client has been updated.");

        client.onMessage((message) => {
            nodecg.log.info(`recieved message "${message}"`);
        });
        setInterval(() => {
            nodecg.log.info("Sending ping ...");
            client.send("ping");
        }, 1000);
    });

    service?.onUnavailable(() => nodecg.log.info("Client has been unset."));
};
