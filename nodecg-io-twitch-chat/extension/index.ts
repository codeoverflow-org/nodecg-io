import { NodeCG } from "nodecg/types/server";
import { emptySuccess, Result, success } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { TwitchServiceClient } from "./twitchClient";

export interface TwitchServiceConfig {
    oauthKey: string;
}

export { TwitchServiceClient } from "./twitchClient";

module.exports = (nodecg: NodeCG) => {
    new TwitchService(nodecg, "twitch-chat", __dirname, "../twitch-schema.json").register();
};

class TwitchService extends ServiceBundle<TwitchServiceConfig, TwitchServiceClient> {
    async validateConfig(config: TwitchServiceConfig): Promise<Result<void>> {
        await TwitchServiceClient.getTokenInfo(config); // This will throw a error if the token is invalid
        return emptySuccess();
    }

    async createClient(config: TwitchServiceConfig): Promise<Result<TwitchServiceClient>> {
        this.nodecg.log.info("Connecting to twitch chat...");
        const client = await TwitchServiceClient.createClient(config);
        this.nodecg.log.info("Successfully connected to twitch.");

        return success(client);
    }

    stopClient(client: TwitchServiceClient): void {
        client
            .getNativeClient()
            .quit()
            .then(() => this.nodecg.log.info("Stopped twitch client successfully."));
    }

    removeHandlers(client: TwitchServiceClient): void {
        client.getNativeClient().removeListener();
    }
}
