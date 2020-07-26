import io = require("socket.io-client");
import { emptySuccess, error, Result } from "nodecg-io-core/extension/utils/result";
import { StreamElementsEvent } from "./types";
import { NodeCG } from 'nodecg/types/server';

export class StreamElements {
    private socket: SocketIOClient.Socket;


    constructor(private jwtToken: string, private accountId: string, private nodecg: NodeCG) {}

    private createSocket() {
        this.socket = io("https://realtime.streamelements.com", { transports: ["websocket"] });
        this.onConnect(() => {
            this.socket.emit("authenticate", {
                method: "jwt",
                token: this.jwtToken,
            });
        });
        this.createReplicans();
    }

    private createReplicans(): void{
        this.onEvent((data) => {
            switch(data.type) {
                case "subscriber":
                    if(data.data.gifted) {
                        this.lastGift.value = data.data.sender;
                    } else {
                        this.lastSub.value = data.data.displayName;
                    }
                    if(data.data.gifted == true) {
                        if(this.lastGift.value === data.data.sender) {
                            this.lastBomb.value = data.data.sender;
                            this.nodecg.log.info(`Retrieved sub bomb: ${this.lastBomb.value}`);
                        }
                        this.lastGift.value = data.data.sender;
                    } else {
                        this.lastGift.value = "";
                    }
                    this.lastSub.value = data.data.displayName;
                    this.nodecg.log.info(`Retrieved subscriber: ${this.lastSub.value}`);
                break;
                case "tip":
                    this.lastTip.value = data.data.username;
                    this.nodecg.log.info(`Retrieved tip: ${this.lastTip.value}`);
                break;
                case "cheer":
                    this.lastCheer.value = data.data.displayName;
                    this.nodecg.log.info(`Retrieved cheer: ${this.lastCheer.value}`);
                break;
            }
        })
    }

    async connect(): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.createSocket();
            this.onConnect(() => resolve(true));
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

    close(): void{
        this.socket.close();
    }

    // TODO: Add replicants

    public lastSub = this.nodecg.Replicant<string | undefined>("streamelements.lastSub", {defaultValue: undefined});
    public lastTip = this.nodecg.Replicant<string | undefined>("streamelements.lastTip", {defaultValue: undefined});
    public lastCheer = this.nodecg.Replicant<string | undefined>("streamelements.lastCheer", {defaultValue: undefined});
    public lastGift = this.nodecg.Replicant<string | undefined>("streamelements.lastGit", {defaultValue: undefined});
    public lastBomb = this.nodecg.Replicant<string | undefined>("streamelements.lastBomb", {defaultValue: undefined});


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

    onEvent(handler: (data: StreamElementsEvent) => void): void{
        this.socket.on("event", handler);
        this.socket.on("event:test", handler);
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
