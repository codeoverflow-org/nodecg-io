import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { TwitchPubSubServiceClient } from "./pubSubClient";

export { TwitchPubSubServiceClient } from "./pubSubClient";

export interface TwitchPubSubServiceConfig {
    oauthKey: string;
}

module.exports = (nodecg: NodeCG) => {
    new TwitchPubSubService(nodecg, "twitch-pubsub", __dirname, "../pubsub-schema.json").register();
};

class TwitchPubSubService extends ServiceBundle<TwitchPubSubServiceConfig, TwitchPubSubServiceClient> {
    async validateConfig(config: TwitchPubSubServiceConfig): Promise<Result<void>> {
        await TwitchPubSubServiceClient.getTokenInfo(config); // This will throw a error if the token is invalid
        return emptySuccess();
    }

    async createClient(config: TwitchPubSubServiceConfig): Promise<Result<TwitchPubSubServiceClient>> {
        const client = await TwitchPubSubServiceClient.createClient(config);

        return success(client);
    }

    stopClient(client: TwitchPubSubServiceClient): void {
        client
            .disconnect()
            .then(() => this.nodecg.log.info("Stopped pubsub client successfully."))
            .catch((err) => this.nodecg.log.error(`Couldn't stop pubsub client: ${err}`));
    }

    // Pubsub has no methods to remove the handlers.
    // At least we can disconnect the client so we must do that on any configuration change and reconnect.
    recreateClientToRemoveHandlers = true;
}
