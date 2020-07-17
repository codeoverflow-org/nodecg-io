import { NodeCG } from "nodecg/types/server";
import { ServiceProvider, ServiceClient } from "nodecg-io-core/extension/types";
import { emptySuccess, success, Result } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import TwitchClient from "twitch";
import ChatClient from "twitch-chat-client";

interface TwitchServiceConfig {
    oauthKey: string;
}

export type TwitchServiceClient = ServiceClient<ChatClient>;

module.exports = (nodecg: NodeCG): ServiceProvider<TwitchServiceClient> | undefined => {
    const twitchService = new TwitchService(nodecg, "twitch", __dirname, "../twitch-schema.json");
    return twitchService.register();
};

class TwitchService extends ServiceBundle<TwitchServiceConfig, TwitchServiceClient> {
    async validateConfig(config: TwitchServiceConfig): Promise<Result<void>> {
        const authKey = config.oauthKey.replace("oauth:", "");
        await TwitchClient.getTokenInfo(authKey); // This will throw a error if the token is invalid
        return emptySuccess();
    }

    async createClient(config: TwitchServiceConfig): Promise<Result<TwitchServiceClient>> {
        // This twitch client needs the token without the "oauth:" before the actual token, strip it away
        const authKey = config.oauthKey.replace("oauth:", "");
        // Create a twitch authentication client
        const tokenInfo = await TwitchClient.getTokenInfo(authKey);
        const authClient = TwitchClient.withCredentials(tokenInfo.clientId, authKey, tokenInfo.scopes);

        // Create the actual chat client and connect
        const chatClient = ChatClient.forTwitchClient(authClient);
        this.nodecg.log.info("Connecting to twitch chat...");
        await chatClient.connect(); // Connects to twitch IRC
        // This also waits till it has registered itself at the IRC server, which is needed to do anything.
        await new Promise((resolve, _reject) => {
            chatClient.onRegister(resolve);
        });
        this.nodecg.log.info("Successfully connected to twitch.");

        return success({
            getNativeClient() {
                return chatClient;
            },
        });
    }

    stopClient(client: TwitchServiceClient): void {
        client.getNativeClient().removeListener();
        client
            .getNativeClient()
            .quit()
            .then(() => this.nodecg.log.info("Stopped twitch client successfully."));
    }
}
