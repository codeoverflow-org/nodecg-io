import io = require("socket.io-client");
import { emptySuccess, error, Result } from "nodecg-io-core/extension/utils/result";
import { StreamElementsEvent } from "./types";
import { connect } from "socket.io-client";

export class StreamElements {
    private socket: SocketIOClient.Socket;

    constructor(private jwtToken: string, private accountId: string) {}

    private createSocket() {
        this.socket = io("https://realtime.streamelements.com", { transports: ["websocket"] });
        this.onConnect(() => {
            this.socket.emit("authenticate", {
                method: "jwt",
                token: this.jwtToken,
            });
        });
    }

    async connect() {
        return new Promise((resolve, _reject) => {
            this.createSocket();
            this.onConnect(resolve);
        });
    }

    async testConnection(): Promise<Result<void>> {
        return new Promise((resolve, reject) => {
            this.createSocket();
            this.onAuthenticated(() => {
                this.close();
                resolve(emptySuccess());
            });
            this.onConnectionError((err) => {
                reject(error(err));
            });
        });
    }

    // TODO: Use replicants

    private onConnect(handler: () => void) {
        this.socket.on("connect", handler);
    }
    private onDisconnect(handler: () => void) {
        this.socket.on("disconnect", handler);
    }
    private onAuthenticated(handler: () => void) {
        this.socket.on("authenticated", handler);
    }
    close() {
        this.socket.close();
    }
    private onConnectionError(handler: (err: string) => void) {
        this.socket.on("connect_error", handler);
    }

    onEvent(handler: (data: StreamElementsEvent) => void) {
        this.socket.on("event", handler);
    }
    onSubscriber(handler: (data: StreamElementsEvent) => void) {
        this.socket.on("event", (data: StreamElementsEvent) => {
            if (data !== null && data.type === "subscriber") {
                handler(data);
            }
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
