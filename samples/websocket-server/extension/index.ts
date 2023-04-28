import NodeCG from "@nodecg/types";
import { WSServerServiceClient } from "nodecg-io-websocket-server";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG.ServerAPI) {
    nodecg.log.info("Sample bundle for WebSocket Server started");

    const webSocketServer = requireService<WSServerServiceClient>(nodecg, "websocket-server");

    webSocketServer?.onAvailable((server) => {
        nodecg.log.info("WebSocket Server has been updated. Ready for connections.");

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

    webSocketServer?.onUnavailable(() => nodecg.log.info("WebSocket Server has been unset."));
};
