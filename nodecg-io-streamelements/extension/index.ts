import { NodeCG } from "nodecg/types/server";
import { success, ServiceBundle } from "nodecg-io-core";
import { StreamElementsServiceClient } from "./StreamElements";

interface StreamElementsServiceConfig {
    jwtToken: string;
}

export { StreamElementsServiceClient } from "./StreamElements";

module.exports = (nodecg: NodeCG) => {
    const schemaPath = [__dirname, "../streamelements-schema.json"];
    new StreamElementsService(nodecg, "streamelements", ...schemaPath).register();
};

class StreamElementsService extends ServiceBundle<StreamElementsServiceConfig, StreamElementsServiceClient> {
    async validateConfig(config: StreamElementsServiceConfig) {
        return new StreamElementsServiceClient(config.jwtToken).testConnection();
    }

    async createClient(config: StreamElementsServiceConfig) {
        this.nodecg.log.info("Connecting to StreamElements socket server...");
        const client = new StreamElementsServiceClient(config.jwtToken);
        await client.connect();
        this.nodecg.log.info("Successfully connected to StreamElements socket server.");

        return success(client);
    }

    stopClient(client: StreamElementsServiceClient) {
        client.close();
    }

    removeHandlers(client: StreamElementsServiceClient) {
        client.removeAllListeners();
    }
}
