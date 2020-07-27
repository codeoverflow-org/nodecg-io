import io = require("socket.io-client");
import { emptySuccess, error, Result } from "nodecg-io-core/extension/utils/result";
import { StreamElementsEvent } from "./types";

export class StreamElements {
    private socket: SocketIOClient.Socket;

    constructor(private jwtToken: string) {}

    private createSocket() {
        this.socket = io("https://realtime.streamelements.com", { transports: ["websocket"] });
        this.onConnect(() => {
            this.socket.emit("authenticate", {
                method: "jwt",
                token: this.jwtToken,
            });
        });
    }

    async connect(): Promise<void> {
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

    close(): void {
        this.socket.close();
    }

    // TODO: Add replicants

    private onConnect(handler: () => void): void {
        this.socket.on("connect", handler);
    }
    // onDisconnect isn't used internally but should still be available to bundles
    // eslint-disable-next-line @typescript-eslint/no-unused-vars-experimental
    private onDisconnect(handler: () => void): void {
        this.socket.on("disconnect", handler);
    }
    private onAuthenticated(handler: () => void): void {
        this.socket.on("authenticated", handler);
    }
    private onConnectionError(handler: (err: string) => void): void {
        this.socket.on("connect_error", handler);
    }

    onEvent(handler: (data: StreamElementsEvent) => void): void {
        this.socket.on("event", handler);
    }

    onSubscriber(handler: (data: StreamElementsEvent) => void): void {
        this.onEvent((data: StreamElementsEvent) => {
            if (data !== null && data.type === "subscriber") {
                handler(data); // use "displayName" to get the name
            }
        });
    }

    onTip(handler: (data: StreamElementsEvent) => void): void {
        this.onEvent((data: StreamElementsEvent) => {
            if (data !== null && data.type === "tip") {
                handler(data); // use "username" to get the name
            }
        });
    }

    onCheer(handler: (data: StreamElementsEvent) => void): void {
        this.onEvent((data: StreamElementsEvent) => {
            if (data !== null && data.type === "cheer") {
                handler(data); // use "displayName" to get the name
            }
        });
    }

    onGift(handler: (data: StreamElementsEvent) => void): void {
        this.onEvent((data: StreamElementsEvent) => {
            if (data !== null && data.type === "subscriber" && data.gifted) {
                handler(data); // use "sender" to get the name
            }
        });
    }

    // TODO: Add support for sub bombs (e.g. by caching the last subs sender)
}
