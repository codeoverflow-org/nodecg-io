import io = require("socket.io-client");
import { Result, emptySuccess, error } from "nodecg-io-core";
import {
    StreamElementsCheerEvent, StreamElementsEvent,
    StreamElementsFollowEvent,
    StreamElementsHostEvent,
    StreamElementsRaidEvent,
    StreamElementsSubscriberEvent,
    StreamElementsTestCheerEvent,
    StreamElementsTestFollowEvent,
    StreamElementsTestHostEvent, StreamElementsTestRaidEvent,
    StreamElementsTestSubscriberEvent, StreamElementsTestTipEvent,
    StreamElementsTipEvent
} from "./StreamElementsEvent";
import { EventEmitter } from "events";
import { Replicant } from "nodecg-types/types/server";

export interface StreamElementsReplicant {
    lastSubscriber?: StreamElementsSubscriberEvent;
    lastTip?: StreamElementsTipEvent;
    lastCheer?: StreamElementsCheerEvent;
    lastGift?: StreamElementsSubscriberEvent;
    lastFollow?: StreamElementsFollowEvent;
    lastRaid?: StreamElementsRaidEvent;
    lastHost?: StreamElementsHostEvent;
}

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
                    this.emit("test:" + data.listener, data);
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

    public onSubscriber(handler: (data: StreamElementsSubscriberEvent) => void): void {
        this.on("subscriber", handler);
    }

    public onTip(handler: (data: StreamElementsTipEvent) => void): void {
        this.on("tip", handler);
    }

    public onCheer(handler: (data: StreamElementsCheerEvent) => void): void {
        this.on("cheer", handler);
    }

    public onGift(handler: (data: StreamElementsSubscriberEvent) => void): void {
        this.on("gift", handler);
    }

    public onFollow(handler: (data: StreamElementsFollowEvent) => void): void {
        this.on("follow", handler);
    }

    public onRaid(handler: (data: StreamElementsRaidEvent) => void): void {
        this.on("raid", handler);
    }

    public onHost(handler: (data: StreamElementsHostEvent) => void): void {
        this.on("host", handler);
    }

    public onTest(handler: (data: StreamElementsEvent) => void): void {
        this.on("test", handler);
    }

    public onTestSubscription(handler: (data: StreamElementsTestSubscriberEvent) => void): void {
        this.on("test:subscription-latest", handler);
    }

    public onTestCheer(handler: (data: StreamElementsTestCheerEvent) => void): void {
        this.on("test:cheer-latest", handler);
    }

    public onTestGift(handler: (data: StreamElementsTestSubscriberEvent) => void): void {
        this.on("test:subscriber-latest", d => {
            if(d.data.gifted) {
                handler(d);
            }
        });
    }

    public onTestFollow(handler: (data: StreamElementsTestFollowEvent) => void): void {
        this.on("test:follower-latest", handler);
    }

    public onTestRaid(handler: (data: StreamElementsTestRaidEvent) => void): void {
        this.on("test:raid-latest", handler);
    }

    public onTestHost(handler: (data: StreamElementsTestHostEvent) => void): void {
        this.on("test:host-latest", handler);
    }

    public onTestTip(handler: (data: StreamElementsTestTipEvent) => void): void {
        this.on("test:tip-latest", handler);
    }

    public setupReplicant(rep: Replicant<StreamElementsReplicant>): void {
        if (rep.value === undefined) {
            rep.value = {};
        }

        this.on("subscriber", (data) => (rep.value.lastSubscriber = data));
        this.on("tip", (data) => (rep.value.lastTip = data));
        this.on("cheer", (data) => (rep.value.lastCheer = data));
        this.on("gift", (data) => (rep.value.lastGift = data));
        this.on("follow", (data) => (rep.value.lastFollow = data));
        this.on("raid", (data) => (rep.value.lastRaid = data));
        this.on("host", (data) => (rep.value.lastHost = data));
    }
}
