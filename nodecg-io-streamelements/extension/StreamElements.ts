let socket: SocketIOClient.Socket, _config: { jwtToken: string; accountId: string };

import io from "socket.io-client";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";

export class StreamElements {
    constructor(config: { jwtToken: string; accountId: string }) {
        _config = config;
    }
    connect() {
        socket = io("https://realtime.streamelements.com", { transports: ["websocket"] });
    }
    onRegister(handler: () => void) {
        socket.on("connect", handler);
    }
    onDisconnect(handler: () => void) {
        socket.on("disconnect", handler);
    }
    onAuthenticated(handler: () => void) {
        socket.on("authenticated", handler);
    }
    close() {
        socket.close();
    }

    static async test(config: { jwtToken: string; accountId: string }): Promise<Result<void>> {
        return new Promise((resolve, reject) => {
            const testSocket = io("https://realtime.streamelements.com", { transports: ["websocket"] });
            testSocket.on("connect", () => {
                testSocket.emit("authenticate", {
                    method: "jwt",
                    token: config.jwtToken,
                });
            });
            testSocket.on("authenticated", () => {
                testSocket.close();
                resolve(emptySuccess());
            });
            testSocket.on("connect_error", (error) => {
                reject(error(error.toString()));
            });
        });
    }
}
