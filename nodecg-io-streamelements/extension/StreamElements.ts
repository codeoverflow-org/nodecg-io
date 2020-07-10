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

    close() {
        this.socket.close();
    }

    // TODO: Add replicants

    private onConnect(handler: () => void) {
        this.socket.on("connect", handler);
    }
    private onDisconnect(handler: () => void) {
        this.socket.on("disconnect", handler);
    }
    private onAuthenticated(handler: () => void) {
        this.socket.on("authenticated", handler);
    }
    private onConnectionError(handler: (err: string) => void) {
        this.socket.on("connect_error", handler);
    }

    onEvent(handler: (data: StreamElementsEvent) => void) {
        this.socket.on("event", handler);
    }

    onSubscriber(handler: (data: StreamElementsEvent) => void) {
        this.onEvent((data: StreamElementsEvent) => {
            if (data !== null && data.type === "subscriber") {
                handler(data); // use "displayName" to get the name
            }
        });
    }

    onTip(handler: (data: StreamElementsEvent) => void) {
        this.onEvent((data: StreamElementsEvent) => {
            if (data !== null && data.type === "tip") {
                handler(data); // use "username" to get the name
            }
        });
    }

    onCheer(handler: (data: StreamElementsEvent) => void) {
        this.onEvent((data: StreamElementsEvent) => {
            if (data !== null && data.type === "cheer") {
                handler(data); // use "displayName" to get the name
            }
        });
    }

    onGift(handler: (data: StreamElementsEvent) => void) {
        this.onEvent((data: StreamElementsEvent) => {
            if (data !== null && data.type === "subscriber" && data.gifted) {
                handler(data); // use "sender" to get the name
            }
        });
    }

    // TODO: Add support for sub bombs (e.g. by caching the last subs sender)
}
