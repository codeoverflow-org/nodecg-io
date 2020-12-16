import { NodeCG } from "nodecg/types/server";
import { emptySuccess, Result, success } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { PubSubServiceClient } from "./pubSubClient";

export { PubSubServiceClient } from "./pubSubClient";


export interface PubSubServiceConfig {
    oauthKey: string;
}

module.exports = (nodecg: NodeCG) => {
    new TwitchService(nodecg, "pubsub", __dirname, "../pubsub-schema.json").register();
};

class TwitchService extends ServiceBundle<PubSubServiceConfig, PubSubServiceClient> {
    async validateConfig(config: PubSubServiceConfig): Promise<Result<void>> {
        await PubSubServiceClient.getTokenInfo(config); // This will throw a error if the token is invalid
        return emptySuccess();
    }

    async createClient(config: PubSubServiceConfig): Promise<Result<PubSubServiceClient>> {
        const client = await PubSubServiceClient.createClient(config);

        return success(client);
    }

    stopClient(_: PubSubServiceClient): void {
    }
}
