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

    stopClient(_: TwitchPubSubServiceClient): void {
        // Not possible
    }

    // Pubsub has no methods to close the connection or remove the handler.
    // It has no way to access the underlying client too, so handlers that are setup once will currently live forever.
    // TODO: implement a way to at least stop the client, removing handlers would be nice too
    recreateClientToRemoveHandlers = true;
}
