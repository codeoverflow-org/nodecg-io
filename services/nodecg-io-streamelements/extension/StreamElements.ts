import io = require("socket.io-client");
import { Result, emptySuccess, error } from "nodecg-io-core";
import {
    StreamElementsCheerEvent,
    StreamElementsEvent,
    StreamElementsFollowEvent,
    StreamElementsHostEvent,
    StreamElementsRaidEvent,
    StreamElementsSubBombEvent,
    StreamElementsSubscriberEvent,
    StreamElementsTestCheerEvent,
    StreamElementsTestEvent,
    StreamElementsTestFollowEvent,
    StreamElementsTestHostEvent,
    StreamElementsTestRaidEvent,
    StreamElementsTestSubscriberEvent,
    StreamElementsTestTipEvent,
    StreamElementsTipEvent,
} from "./StreamElementsEvent";
import { EventEmitter } from "events";
import { Replicant } from "nodecg-types/types/server";

export interface StreamElementsReplicant {
    lastSubscriber?: StreamElementsSubscriberEvent;
    lastSubBomb?: StreamElementsSubBombEvent<StreamElementsSubscriberEvent>;
    lastTip?: StreamElementsTipEvent;
    lastCheer?: StreamElementsCheerEvent;
    lastGift?: StreamElementsSubscriberEvent;
    lastFollow?: StreamElementsFollowEvent;
    lastRaid?: StreamElementsRaidEvent;
    lastHost?: StreamElementsHostEvent;
}

/**
 * Internal utility interface for tracking sub-bombs.
 */
interface SubBomb {
    timeout: NodeJS.Timeout;
    subs: Array<StreamElementsSubscriberEvent | StreamElementsTestSubscriberEvent>;
}

export class StreamElementsServiceClient extends EventEmitter {
    private socket: SocketIOClient.Socket;
    private subBombDetectionMap: Map<string, SubBomb> = new Map();

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
                    this.handleSubGift(
                        data.data.sender,
                        data,
                        (subBomb) => this.emit("subbomb", subBomb),
                        (gift) => this.emit("gift", gift),
                    );
                }
            }
            this.emit(data.type, data);
        });

        if (this.handleTestEvents) {
            this.onTestEvent((data: StreamElementsTestEvent) => {
                if (data.listener) {
                    this.emit("test", data);
                    this.emit("test:" + data.listener, data);
                }
            });

            this.onTestSubscriber((data) => {
                if (data.event.gifted) {
                    this.handleSubGift(
                        data.event.sender,
                        data,
                        (subBomb) => this.emit("test:subbomb", subBomb),
                        (gift) => this.emit("test:gift", gift),
                    );
                }
            });
        }
    }

    private handleSubGift<T extends StreamElementsSubscriberEvent | StreamElementsTestSubscriberEvent>(
        subGifter: string | undefined,
        gift: T,
        handlerSubBomb: (data: StreamElementsSubBombEvent<T>) => void,
        handlerGift: (data: T) => void,
    ) {
        const gifter = subGifter ?? "anonymous";

        const subBomb = this.subBombDetectionMap.get(gifter) ?? {
            subs: [],
            timeout: setTimeout(() => {
                this.subBombDetectionMap.delete(gifter);

                // Only fire sub bomb event if more than one sub were gifted.
                // Otherwise, this is just a single gifted sub.
                if (subBomb.subs.length > 1) {
                    const subBombEvent = {
                        gifterUsername: gifter,
                        subscribers: subBomb.subs as T[],
                    };
                    handlerSubBomb(subBombEvent);
                }

                subBomb.subs.forEach(handlerGift);
            }, 1000),
        };

        subBomb.subs.push(gift);

        // New subs in this sub bomb. Refresh timeout in case another one follows.
        subBomb.timeout.refresh();

        this.subBombDetectionMap.set(gifter, subBomb);
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

    private onTestEvent(handler: (data: StreamElementsTestEvent) => void): void {
        this.socket.on("event:test", (data: StreamElementsTestEvent) => {
            if (data) {
                handler(data);
            }
        });
    }

    public onSubscriber(handler: (data: StreamElementsSubscriberEvent) => void, includeSubGifts = true): void {
        this.on("subscriber", (data) => {
            if (data.data.gifted && !includeSubGifts) return;
            handler(data);
        });
    }

    public onSubscriberBomb(handler: (data: StreamElementsSubBombEvent<StreamElementsSubscriberEvent>) => void): void {
        this.on("subbomb", handler);
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

    public onTestSubscriber(handler: (data: StreamElementsTestSubscriberEvent) => void, includeSubGifts = true): void {
        this.on("test:subscriber-latest", (data) => {
            if (data.event.gifted && !includeSubGifts) return;
            handler(data);
        });
    }

    public onTestSubscriberBomb(
        handler: (data: StreamElementsSubBombEvent<StreamElementsTestSubscriberEvent>) => void,
    ): void {
        this.on("test:subbomb", handler);
    }

    public onTestGift(handler: (data: StreamElementsTestSubscriberEvent) => void): void {
        this.on("test:gift", handler);
    }

    public onTestCheer(handler: (data: StreamElementsTestCheerEvent) => void): void {
        this.on("test:cheer-latest", handler);
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

        this.onSubscriber((data) => (rep.value.lastSubscriber = data));
        this.onSubscriberBomb((data) => (rep.value.lastSubBomb = data));
        this.onTip((data) => (rep.value.lastTip = data));
        this.onCheer((data) => (rep.value.lastCheer = data));
        this.onGift((data) => (rep.value.lastGift = data));
        this.onFollow((data) => (rep.value.lastFollow = data));
        this.onRaid((data) => (rep.value.lastRaid = data));
        this.onHost((data) => (rep.value.lastHost = data));
    }
}
