import { getTokenInfo, StaticAuthProvider, TokenInfo } from "twitch-auth";
import { TwitchPubSubServiceConfig } from "./index";
import { BasicPubSubClient, SingleUserPubSubClient } from "twitch-pubsub-client";
import { ApiClient } from "twitch";

export class TwitchPubSubServiceClient extends SingleUserPubSubClient {
    private basicClient: BasicPubSubClient;
    constructor(apiClient: ApiClient, basicClient: BasicPubSubClient, private readonly userId: string) {
        super({ twitchClient: apiClient, pubSubClient: basicClient });
        this.basicClient = basicClient;
    }

    /**
     * Creates a instance of TwitchServiceClient using the credentials from the passed config.
     */
    static async createClient(cfg: TwitchPubSubServiceConfig): Promise<TwitchPubSubServiceClient> {
        // Create a twitch authentication provider
        const tokenInfo = await TwitchPubSubServiceClient.getTokenInfo(cfg);
        const authProvider = new StaticAuthProvider(tokenInfo.clientId, this.normalizeToken(cfg), tokenInfo.scopes);

        // Create the actual pubsub client and connect
        const apiClient = new ApiClient({ authProvider });
        const user = await apiClient.helix.users.getMe();
        const basicClient = new BasicPubSubClient();
        const pubSubClient = new TwitchPubSubServiceClient(apiClient, basicClient, user.id);

        await basicClient.connect();
        return pubSubClient;
    }

    /**
     * Gets the token info for the passed config.
     */
    static async getTokenInfo(cfg: TwitchPubSubServiceConfig): Promise<TokenInfo> {
        return await getTokenInfo(this.normalizeToken(cfg));
    }

    /**
     * Strips any "oauth:" before the token away, because the client needs the token without it.
     */
    private static normalizeToken(cfg: TwitchPubSubServiceConfig): string {
        return cfg.oauthKey.replace("oauth:", "");
    }

    getUserID(): string {
        return this.userId;
    }

    disconnect(): Promise<void> {
        return this.basicClient.disconnect();
    }
}
