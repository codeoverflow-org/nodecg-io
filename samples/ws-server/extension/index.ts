import { NodeCG } from "nodecg/types/server";
import { WSServerServiceClient } from "nodecg-io-websocket-server/extension";
import { requireService } from "nodecg-io-core/extension/serviceClientWrapper";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for WebSocket Server started");

    const webSocketServer = requireService<WSServerServiceClient>(nodecg, "websocket-server");

    webSocketServer?.onAvailable((client) => {
        nodecg.log.info("WebSocket Server has been set. Ready for connections.");

        const server = client.getRawClient();
        server.on("connection", (websocket) => {
            websocket.on("message", (message) => {
                if (message.toString().toLowerCase() === "ping") {
                    websocket.send("pong");
                } else {
                    server.clients.forEach((client) => client.send(message));
                }
            });
        });
    });

    webSocketServer?.onUnavailable(() => nodecg.log.info("WebSocket Server has been unset!"));
};
