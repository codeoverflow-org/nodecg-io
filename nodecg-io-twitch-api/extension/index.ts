import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { ApiClient } from "twitch";
import { getTokenInfo, StaticAuthProvider, TokenInfo } from "twitch-auth";

export interface TwitchApiServiceConfig {
    oauthKey: string;
}

export type TwitchApiServiceClient = ApiClient;

module.exports = (nodecg: NodeCG) => {
    new TwitchService(nodecg, "twitch-api", __dirname, "../twitch-api-schema.json").register();
};

class TwitchService extends ServiceBundle<TwitchApiServiceConfig, TwitchApiServiceClient> {
    async validateConfig(config: TwitchApiServiceConfig): Promise<Result<void>> {
        await TwitchService.getTokenInfo(config); // This will throw a error if the token is invalid
        return emptySuccess();
    }

    async createClient(config: TwitchApiServiceConfig): Promise<Result<TwitchApiServiceClient>> {
        const client = await TwitchService.createClient(config);
        this.nodecg.log.info("Successfully created twitch-api client.");

        return success(client);
    }

    stopClient(_client: TwitchApiServiceClient): void {
        // can't be stopped, has no persistent connection
    }

    /**
     * Creates a ApiClient instance using the credentials from the passed config.
     */
    private static async createClient(cfg: TwitchApiServiceConfig): Promise<TwitchApiServiceClient> {
        // Create a twitch authentication provider
        const tokenInfo = await TwitchService.getTokenInfo(cfg);
        const authProvider = new StaticAuthProvider(tokenInfo.clientId, this.normalizeToken(cfg), tokenInfo.scopes);

        // Create the twitch api client
        return new ApiClient({ authProvider });
    }

    /**
     * Gets the token info for the passed config.
     */
    private static async getTokenInfo(cfg: TwitchApiServiceConfig): Promise<TokenInfo> {
        return await getTokenInfo(TwitchService.normalizeToken(cfg));
    }

    /**
     * Strips any "oauth:" before the token away, because the client needs the token without it.
     */
    private static normalizeToken(cfg: TwitchApiServiceConfig): string {
        return cfg.oauthKey.replace("oauth:", "");
    }
}
