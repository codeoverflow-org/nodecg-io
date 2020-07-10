import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { WSServerServiceClient } from "nodecg-io-ws-server/extension";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for WebSocket Server started");

    // This explicit cast determines the client type in the requireService call
    const webSocketServer = (nodecg.extensions["nodecg-io-ws-server"] as unknown) as
        | ServiceProvider<WSServerServiceClient>
        | undefined;

    webSocketServer?.requireService(
        "websocket-server",
        (client) => {
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
        },
        () => nodecg.log.info("WebSocket Server has been unset!"),
    );
};
