import NodeCG from "@nodecg/types";
import { success, ServiceBundle, Logger } from "nodecg-io-core";
import { StreamElementsServiceClient } from "./StreamElements";

interface StreamElementsServiceConfig {
    jwtToken: string;
    handleTestEvents: boolean;
}

export { StreamElementsServiceClient, StreamElementsReplicant } from "./StreamElements";

module.exports = (nodecg: NodeCG.ServerAPI) => {
    const schemaPath = [__dirname, "../streamelements-schema.json"];
    new StreamElementsService(nodecg, "streamelements", ...schemaPath).register();
};

class StreamElementsService extends ServiceBundle<StreamElementsServiceConfig, StreamElementsServiceClient> {
    async validateConfig(config: StreamElementsServiceConfig) {
        return new StreamElementsServiceClient(config.jwtToken, config.handleTestEvents).testConnection();
    }

    async createClient(config: StreamElementsServiceConfig, logger: Logger) {
        logger.info("Connecting to StreamElements socket server...");
        const client = new StreamElementsServiceClient(config.jwtToken, config.handleTestEvents);
        await client.connect();
        logger.info("Successfully connected to StreamElements socket server.");

        return success(client);
    }

    stopClient(client: StreamElementsServiceClient) {
        client.close();
    }

    removeHandlers(client: StreamElementsServiceClient) {
        client.removeAllListeners();
    }
}
