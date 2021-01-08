import { NodeCG } from "nodecg/types/server";
import { emptySuccess, Result, success } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { PubSubServiceClient } from "./pubSubClient";

export { PubSubServiceClient } from "./pubSubClient";

export interface PubSubServiceConfig {
    oauthKey: string;
}

module.exports = (nodecg: NodeCG) => {
    new TwitchPubSubService(nodecg, "twitch-pubsub", __dirname, "../pubsub-schema.json").register();
};

class TwitchPubSubService extends ServiceBundle<PubSubServiceConfig, PubSubServiceClient> {
    async validateConfig(config: PubSubServiceConfig): Promise<Result<void>> {
        await PubSubServiceClient.getTokenInfo(config); // This will throw a error if the token is invalid
        return emptySuccess();
    }

    async createClient(config: PubSubServiceConfig): Promise<Result<PubSubServiceClient>> {
        const client = await PubSubServiceClient.createClient(config);

        return success(client);
    }

    stopClient(_: PubSubServiceClient): void {
        // Not possible
    }

    // Pubsub has no methods to close the connection or remove the handler.
    // It has no way to access the underlying client too, so handlers that are setup once will currently live forever.
    // TODO: implement a way to at least stop the client, removing handlers would be nice too
    recreateClientToRemoveHandlers = true;
}
