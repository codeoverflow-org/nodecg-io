import io = require("socket.io-client");
import { Result, emptySuccess, error } from "nodecg-io-core";
import { StreamElementsEvent } from "./StreamElementsEvent";
import { EventEmitter } from "events";

export class StreamElementsServiceClient extends EventEmitter {
    private socket: SocketIOClient.Socket;

    constructor(private jwtToken: string, private handleTestEvents: boolean) {
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
        if (this.handleTestEvents) {
            this.onTestEvent((data: StreamElementsEvent) => {
                if (data.listener) {
                    this.emit("test", data);
                }
            });
        }
    }

    async connect(): Promise<void> {
        return new Promise((resolve, _reject) => {
            this.createSocket();
            this.onConnect(resolve);
        });
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

    private onEvent(handler: (data: StreamElementsEvent) => void): void {
        this.socket.on("event", (data: StreamElementsEvent) => {
            if (data) {
                handler(data);
            }
        });
    }

    private onTestEvent(handler: (data: StreamElementsEvent) => void): void {
        this.socket.on("event:test", (data: StreamElementsEvent) => {
            if (data) {
                handler(data);
            }
        });
    }

    public onSubscriber(handler: (data: StreamElementsEvent) => void): void {
        this.on("subscriber", handler);
    }

    public onTip(handler: (data: StreamElementsEvent) => void): void {
        this.on("tip", handler);
    }

    public onCheer(handler: (data: StreamElementsEvent) => void): void {
        this.on("cheer", handler);
    }

    public onGift(handler: (data: StreamElementsEvent) => void): void {
        this.on("gift", handler);
    }

    public onFollow(handler: (data: StreamElementsEvent) => void): void {
        this.on("follow", handler);
    }

    public onRaid(handler: (data: StreamElementsEvent) => void): void {
        this.on("raid", handler);
    }

    public onHost(handler: (data: StreamElementsEvent) => void): void {
        this.on("host", handler);
    }

    public onTest(handler: (data: StreamElementsEvent) => void): void {
        this.on("test", handler);
    }
}
