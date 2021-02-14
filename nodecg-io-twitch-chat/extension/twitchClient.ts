import { ChatClient } from "twitch-chat-client";
import { AuthProvider, getTokenInfo, StaticAuthProvider, TokenInfo } from "twitch-auth";
import { TwitchServiceConfig } from "./index";

export class TwitchChatServiceClient extends ChatClient {
    constructor(authProvider: AuthProvider) {
        super(authProvider);
    }

    /**
     * Creates a instance of TwitchServiceClient using the credentials from the passed config.
     */
    static async createClient(cfg: TwitchServiceConfig): Promise<TwitchChatServiceClient> {
        // Create a twitch authentication provider
        const tokenInfo = await TwitchChatServiceClient.getTokenInfo(cfg);
        const authProvider = new StaticAuthProvider(tokenInfo.clientId, this.normalizeToken(cfg), tokenInfo.scopes);

        // Create the actual chat client and connect
        const chatClient = new TwitchChatServiceClient(authProvider);

        await chatClient.connect(); // Connects to twitch IRC

        // This also waits till it has registered itself at the IRC server, which is needed to do anything.
        await new Promise((resolve, _reject) => {
            chatClient.onRegister(() => resolve(undefined));
        });

        return chatClient;
    }

    /**
     * Gets the token info for the passed config.
     */
    static async getTokenInfo(cfg: TwitchServiceConfig): Promise<TokenInfo> {
        return await getTokenInfo(this.normalizeToken(cfg));
    }

    /**
     * Strips any "oauth:" before the token away, because the client needs the token without it.
     */
    static normalizeToken(cfg: TwitchServiceConfig): string {
        return cfg.oauthKey.replace("oauth:", "");
    }

    // In the nodecg-io environment we can't add a list of channels to the client at the time of creation because
    // we don't know which bundles will use it and which channels they want to join.
    // Therefore we must handle reconnecting ourselfs and we do that by overriding the join method
    // so that the user doesn't need to do it.

    /**
     * Joins a twitch chat channel and automatically rejoins after a reconnect.
     * @param channel the channel to join
     */
    join(channel: string): Promise<void> {
        this.onRegister(() => {
            this.join(channel);
        });

        return super.join(channel);
    }
}
