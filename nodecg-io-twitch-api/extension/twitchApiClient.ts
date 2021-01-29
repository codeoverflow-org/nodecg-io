import { ServiceClient } from "nodecg-io-core";
import { ApiClient } from "twitch";
import { StaticAuthProvider, getTokenInfo, TokenInfo } from "twitch-auth";
import { TwitchApiServiceConfig } from ".";

export class TwitchApiServiceClient implements ServiceClient<ApiClient> {
    constructor(private client: ApiClient) {}

    /**
     * Creates a instance of TwitchServiceClient using the credentials from the passed config.
     */
    static async createClient(cfg: TwitchApiServiceConfig): Promise<TwitchApiServiceClient> {
        // Create a twitch authentication provider
        const tokenInfo = await TwitchApiServiceClient.getTokenInfo(cfg);
        const authProvider = new StaticAuthProvider(tokenInfo.clientId, this.normalizeToken(cfg), tokenInfo.scopes);

        // Create the twitch api client
        const apiClient = new ApiClient({ authProvider });
        return new TwitchApiServiceClient(apiClient);
    }

    /**
     * Gets the token info for the passed config.
     */
    static async getTokenInfo(cfg: TwitchApiServiceConfig): Promise<TokenInfo> {
        return await getTokenInfo(this.normalizeToken(cfg));
    }

    /**
     * Strips any "oauth:" before the token away, because the client needs the token without it.
     */
    private static normalizeToken(cfg: TwitchApiServiceConfig): string {
        return cfg.oauthKey.replace("oauth:", "");
    }

    getNativeClient(): ApiClient {
        return this.client;
    }
}
