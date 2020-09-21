import { NodeCG } from "nodecg/types/server";
import { requireService } from "nodecg-io-core/extension/serviceClientWrapper";
import { WSClientServiceClient } from "nodecg-io-websocket-client/extension";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for websocket-client started");

    const service = requireService<WSClientServiceClient>(nodecg, "websocket-client");
    service?.onAvailable((client) => {
        nodecg.log.info("Client has been updated.");

        const sock = client.getNativeClient();
        sock.addListener("message", (code: number, data: string) => {
            nodecg.log.info(`recieved message "${data}" with code: ${code}`);
        });
        setInterval(() => {
            nodecg.log.info("Sending ping ...");
            sock.send("ping");
        }, 10000);
    });

    service?.onUnavailable(() => nodecg.log.info("Client has been unset."));
};
