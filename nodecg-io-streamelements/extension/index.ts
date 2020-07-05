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
        return StreamElements.test(config);
    }

    async createClient(config: StreamElementsServiceConfig) {
        // Tokens
        const jwtToken = config.jwtToken;
        const accountId = config.accountId;

        // Create the actual client and connect
        const client = new StreamElements({ jwtToken, accountId });
        this.nodecg.log.info("Connecting to StreamElements socket server...");
        await client.connect(); // Connects to StreamElements socket server
        // This also waits till it has registered itself at the StreamElements socket server, which is needed to do anything.
        await new Promise((resolve, _reject) => {
            client.onRegister(resolve);
        });
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
