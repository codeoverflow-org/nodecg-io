import NodeCG from "@nodecg/types";
import { Result, emptySuccess, success, ServiceBundle, Logger } from "nodecg-io-core";
import { TwitchChatServiceClient } from "./twitchClient";
import { getTokenInfo, TwitchServiceConfig } from "nodecg-io-twitch-auth";

export { TwitchChatServiceClient } from "./twitchClient";

module.exports = (nodecg: NodeCG.ServerAPI) => {
    new TwitchService(nodecg, "twitch-chat", __dirname, "../twitch-schema.json").register();
};

class TwitchService extends ServiceBundle<TwitchServiceConfig, TwitchChatServiceClient> {
    async validateConfig(config: TwitchServiceConfig): Promise<Result<void>> {
        await getTokenInfo(config); // This will throw a error if the token is invalid
        return emptySuccess();
    }

    async createClient(config: TwitchServiceConfig, logger: Logger): Promise<Result<TwitchChatServiceClient>> {
        logger.info("Connecting to twitch chat...");
        const client = await TwitchChatServiceClient.createClient(config);
        logger.info("Successfully connected to twitch.");

        return success(client);
    }

    stopClient(client: TwitchChatServiceClient, logger: Logger): void {
        client.quit().then(() => logger.info("Successfully stopped twitch client."));
    }

    removeHandlers(client: TwitchChatServiceClient): void {
        client.removeListener();
    }
}
