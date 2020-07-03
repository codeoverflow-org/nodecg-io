let socket: SocketIOClient.Socket, _config: { jwtToken: string; accountId: string };

import io = require("socket.io-client");
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";

export class StreamElements {
    constructor(config: { jwtToken: string; accountId: string }) {
        _config = config;
    }
    connect() {
        socket = io("https://realtime.streamelements.com", { transports: ["websocket"] });
        socket.on("connect", () => {
            socket.emit("authenticate", {
                method: "jwt",
                token: _config.jwtToken,
            });
        });
    }

    // TODO: Use replicants

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
    onEvent(handler: () => void) {
        socket.on("event", handler);
    }
    onSubscriber(handler: (data: any) => void) {
        socket.on("event", (data: any) => {
            if (data !== null && data.type == "subscriber") {
                handler(data);
            }
        });
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
            testSocket.on("connect_error", (err: { toString: () => string }) => {
                reject(error(err.toString()));
            });
        });
    }
}

/*
switch (data.type) {
                case "subscriber":

                    // Handle sub bombs
                    if(data.data.gifted == true) {
                        if(this.lastGift === data.data.sender) {
                            this._lastBomb = data.data.sender;
                            console.log(`Retrieved sub bomb: ${this.lastBomb}`);
                        }
                        this.lastGift = data.data.sender;
                    } else {
                        this.lastGift = "";
                    }

                    this._lastSubscriber = data.data.displayName;
                    console.log(`Retrieved subscriber: ${this.lastSubscriber}`);
                    break;
                case "tip":
                    this._lastTip = data.data.username;
                    console.log(`Retrieved tip: ${this.lastTip}`);
                    break;
                case "cheer":
                    this._lastCheer = data.data.displayName;
                    console.log(`Retrieved cheer: ${this.lastCheer}`);
                    break;
            }
        }
        */
