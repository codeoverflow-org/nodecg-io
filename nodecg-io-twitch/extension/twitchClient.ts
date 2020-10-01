import { ServiceClient } from "nodecg-io-core/extension/types";
import { ChatClient } from "twitch-chat-client";
import { getTokenInfo, StaticAuthProvider, TokenInfo } from "twitch-auth";
import { TwitchServiceConfig } from "./index";

export class TwitchServiceClient implements ServiceClient<ChatClient> {
    constructor(private client: ChatClient) {}

    /**
     * Creates a instance of TwitchServiceClient using the credentials from the passed config.
     */
    static async createClient(cfg: TwitchServiceConfig): Promise<TwitchServiceClient> {
        // Create a twitch authentication provider
        const tokenInfo = await TwitchServiceClient.getTokenInfo(cfg);
        const authProvider = new StaticAuthProvider(tokenInfo.clientId, this.normalizeToken(cfg), tokenInfo.scopes);

        // Create the actual chat client and connect
        const chatClient = new ChatClient(authProvider);

        await chatClient.connect(); // Connects to twitch IRC

        // This also waits till it has registered itself at the IRC server, which is needed to do anything.
        await new Promise((resolve, _reject) => {
            chatClient.onRegister(resolve);
        });

        return new TwitchServiceClient(chatClient);
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

    getNativeClient(): ChatClient {
        return this.client;
    }

    /**
     * Joins a twitch chat channel and automatically rejoins after a reconnect.
     * @param channel the channel to join
     */
    join(channel: string): Promise<void> {
        this.client.onRegister(() => {
            this.client.join(channel);
        });

        return this.client.join(channel);
    }
}
