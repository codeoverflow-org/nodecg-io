import { NodeCG } from "nodecg/types/server";
import { success } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { StreamElements } from "./StreamElements";

interface StreamElementsServiceConfig {
    jwtToken: string;
    accountId: string;
}

export interface StreamElementsServiceClient {
    getRawClient(): StreamElements;
}

module.exports = (nodecg: NodeCG) => {
    const schemaPath = [__dirname, "../streamelements-schema.json"];
    const streamElementsService = new StreamElementsService(nodecg, "streamelements", ...schemaPath);
    return streamElementsService.register();
};

class StreamElementsService extends ServiceBundle<StreamElementsServiceConfig, StreamElementsServiceClient> {
    async validateConfig(config: StreamElementsServiceConfig) {
        return new StreamElements(config.jwtToken, config.accountId).testConnection();
    }

    async createClient(config: StreamElementsServiceConfig) {
        this.nodecg.log.info("Connecting to StreamElements socket server...");
        const client = new StreamElements(config.jwtToken, config.accountId);
        await client.connect();
        this.nodecg.log.info("Successfully connected to StreamElements socket server.");

        return success({
            getRawClient() {
                return client;
            },
        });
    }

    stopClient(client: StreamElementsServiceClient) {
        client.getRawClient().close();
    }
}
