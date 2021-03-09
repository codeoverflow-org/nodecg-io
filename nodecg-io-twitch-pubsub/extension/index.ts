import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { getTokenInfo, TwitchServiceConfig } from "nodecg-io-twitch-auth";
import { TwitchPubSubServiceClient } from "./pubSubClient";

export { TwitchPubSubServiceClient } from "./pubSubClient";

module.exports = (nodecg: NodeCG) => {
    new TwitchPubSubService(nodecg, "twitch-pubsub", __dirname, "../pubsub-schema.json").register();
};

class TwitchPubSubService extends ServiceBundle<TwitchServiceConfig, TwitchPubSubServiceClient> {
    async validateConfig(config: TwitchServiceConfig): Promise<Result<void>> {
        await getTokenInfo(config); // This will throw a error if the token is invalid
        return emptySuccess();
    }

    async createClient(config: TwitchServiceConfig): Promise<Result<TwitchPubSubServiceClient>> {
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
