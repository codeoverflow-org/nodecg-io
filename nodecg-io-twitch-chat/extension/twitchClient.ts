import { ChatClient } from "twitch-chat-client";
import { createAuthProvider } from "nodecg-io-twitch-auth";
import { TwitchServiceConfig } from "./index";

export class TwitchChatServiceClient extends ChatClient {
    /**
     * Creates a instance of TwitchServiceClient using the credentials from the passed config.
     */
    static async createClient(cfg: TwitchServiceConfig): Promise<TwitchChatServiceClient> {
        // Create a twitch authentication provider
        const authProvider = await createAuthProvider(cfg);

        // Create the actual chat client and connect
        const chatClient = new TwitchChatServiceClient(authProvider);
        await chatClient.connect();

        // This also waits till it has registered itself at the IRC server, which is needed to do anything.
        await new Promise((resolve, _reject) => {
            chatClient.onRegister(() => resolve(undefined));
        });

        return chatClient;
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
