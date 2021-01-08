import { ServiceClient } from "nodecg-io-core/extension/types";
import { getTokenInfo, StaticAuthProvider, TokenInfo } from "twitch-auth";
import { PubSubServiceConfig } from "./index";
import {
    PubSubBitsBadgeUnlockMessage,
    PubSubBitsMessage,
    PubSubChatModActionMessage,
    PubSubClient,
    PubSubListener,
    PubSubRedemptionMessage,
    PubSubSubscriptionMessage,
    PubSubWhisperMessage,
} from "twitch-pubsub-client";
import { ApiClient } from "twitch";

export class PubSubServiceClient implements ServiceClient<PubSubClient> {
    constructor(private client: PubSubClient, private userid: string) {}

    /**
     * Creates a instance of TwitchServiceClient using the credentials from the passed config.
     */
    static async createClient(cfg: PubSubServiceConfig): Promise<PubSubServiceClient> {
        // Create a twitch authentication provider
        const tokenInfo = await PubSubServiceClient.getTokenInfo(cfg);
        const authProvider = new StaticAuthProvider(tokenInfo.clientId, this.normalizeToken(cfg), tokenInfo.scopes);

        // Create the actual chat client and connect
        const apiClient = new ApiClient({ authProvider });
        const pubSubClient = new PubSubClient();
        const userID = await pubSubClient.registerUserListener(apiClient);

        return new PubSubServiceClient(pubSubClient, userID);
    }

    /**
     * Gets the token info for the passed config.
     */
    static async getTokenInfo(cfg: PubSubServiceConfig): Promise<TokenInfo> {
        return await getTokenInfo(this.normalizeToken(cfg));
    }

    /**
     * Strips any "oauth:" before the token away, because the client needs the token without it.
     */
    static normalizeToken(cfg: PubSubServiceConfig): string {
        return cfg.oauthKey.replace("oauth:", "");
    }

    getNativeClient(): PubSubClient {
        return this.client;
    }

    getUserID(): string {
        return this.userid;
    }

    async onRedemption(
        callback: (message: PubSubRedemptionMessage) => void,
    ): Promise<PubSubListener<PubSubRedemptionMessage>> {
        return await this.client.onRedemption(this.userid, callback);
    }

    async onSubscription(
        callback: (message: PubSubSubscriptionMessage) => void,
    ): Promise<PubSubListener<PubSubSubscriptionMessage>> {
        return await this.client.onSubscription(this.userid, callback);
    }

    async onBits(callback: (message: PubSubBitsMessage) => void): Promise<PubSubListener<PubSubBitsMessage>> {
        return await this.client.onBits(this.userid, callback);
    }

    async onBitsBadgeUnlock(
        callback: (message: PubSubBitsBadgeUnlockMessage) => void,
    ): Promise<PubSubListener<PubSubBitsBadgeUnlockMessage>> {
        return await this.client.onBitsBadgeUnlock(this.userid, callback);
    }

    async onModAction(
        channelID: string,
        callback: (message: PubSubChatModActionMessage) => void,
    ): Promise<PubSubListener<PubSubChatModActionMessage>> {
        return await this.client.onModAction(this.userid, channelID, callback);
    }

    async onWhisper(callback: (message: PubSubWhisperMessage) => void): Promise<PubSubListener<PubSubWhisperMessage>> {
        return await this.client.onWhisper(this.userid, callback);
    }
}
