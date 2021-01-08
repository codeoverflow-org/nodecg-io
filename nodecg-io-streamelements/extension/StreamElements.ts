import io = require("socket.io-client");
import { Result, emptySuccess, error, ServiceClient } from "nodecg-io-core";
import { StreamElementsEvent } from "./types";
import { EventEmitter } from "events";

export class StreamElementsServiceClient extends EventEmitter implements ServiceClient<SocketIOClient.Socket> {
    private socket: SocketIOClient.Socket;

    constructor(private jwtToken: string) {
        super();
    }

    private createSocket() {
        this.socket = io("https://realtime.streamelements.com", { transports: ["websocket"] });
        this.onConnect(() => {
            this.socket.emit("authenticate", {
                method: "jwt",
                token: this.jwtToken,
            });
        });
        this.registerEvents();
    }

    private registerEvents(): void {
        this.onEvent((data: StreamElementsEvent) => {
            if (data.type === "subscriber") {
                if (data.data.gifted) {
                    this.emit("gift", data);
                }
            }
            this.emit(data.type, data);
        });
    }

    async connect(): Promise<void> {
        return new Promise((resolve, _reject) => {
            this.createSocket();
            this.onConnect(resolve);
        });
    }

    getNativeClient(): SocketIOClient.Socket {
        return this.socket;
    }

    async testConnection(): Promise<Result<void>> {
        return new Promise((resolve, _reject) => {
            this.createSocket();
            this.onAuthenticated(() => {
                this.close();
                resolve(emptySuccess());
            });
            this.onConnectionError((err) => {
                resolve(error(err));
            });
            this.onUnauthorized((err) => {
                resolve(error(err));
            });
        });
    }

    close(): void {
        this.socket.close();
    }

    private onConnect(handler: () => void): void {
        this.socket.on("connect", handler);
    }

    private onAuthenticated(handler: () => void): void {
        this.socket.on("authenticated", handler);
    }

    private onUnauthorized(handler: (err: string) => void): void {
        this.socket.on("unauthorized", (err: { message: string }) => {
            handler(err.message);
        });
    }

    private onConnectionError(handler: (err: string) => void): void {
        this.socket.on("connect_error", handler);
    }

    onEvent(handler: (data: StreamElementsEvent) => void): void {
        this.socket.on("event", (data: StreamElementsEvent) => {
            if (data) {
                handler(data);
            }
        });
    }

    onSubscriber(handler: (data: StreamElementsEvent) => void): void {
        this.on("subscriber", handler);
    }

    onTip(handler: (data: StreamElementsEvent) => void): void {
        this.on("tip", handler);
    }

    onCheer(handler: (data: StreamElementsEvent) => void): void {
        this.on("cheer", handler);
    }

    onGift(handler: (data: StreamElementsEvent) => void): void {
        this.on("gift", handler);
    }

    onFollow(handler: (data: StreamElementsEvent) => void): void {
        this.on("follow", handler);
    }

    onRaid(handler: (data: StreamElementsEvent) => void): void {
        this.on("raid", handler);
    }

    onHost(handler: (data: StreamElementsEvent) => void): void {
        this.on("host", handler);
    }

    // TODO: Add support for sub bombs (e.g. by caching the last subs sender)
}
