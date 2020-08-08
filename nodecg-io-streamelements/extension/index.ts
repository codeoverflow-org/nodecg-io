import { NodeCG } from "nodecg/types/server";
import { success } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { StreamElements } from "./StreamElements";
import { StreamElementsEvent } from "./types";

interface StreamElementsServiceConfig {
    jwtToken: string;
    accountId: string;
}

export interface StreamElementsServiceClient {
    getRawClient(): StreamElements;
    onEvent(handler: (data: StreamElementsEvent) => void): void;
    onFollow(handler: (data: StreamElementsEvent) => void): void;
    onRaid(handler: (data: StreamElementsEvent) => void): void;
    onHost(handler: (data: StreamElementsEvent) => void): void;
    onSubscriber(handler: (data: StreamElementsEvent) => void): void;
    onGift(handler: (data: StreamElementsEvent) => void): void;
    onTip(handler: (data: StreamElementsEvent) => void): void;
    onCheer(handler: (data: StreamElementsEvent) => void): void;
}

module.exports = (nodecg: NodeCG) => {
    const schemaPath = [__dirname, "../streamelements-schema.json"];
    new StreamElementsService(nodecg, "streamelements", ...schemaPath).register();
};

class StreamElementsService extends ServiceBundle<StreamElementsServiceConfig, StreamElementsServiceClient> {
    async validateConfig(config: StreamElementsServiceConfig) {
        return new StreamElements(config.jwtToken).testConnection();
    }

    async createClient(config: StreamElementsServiceConfig) {
        this.nodecg.log.info("Connecting to StreamElements socket server...");
        const client = new StreamElements(config.jwtToken);
        await client.connect();
        this.nodecg.log.info("Successfully connected to StreamElements socket server.");

        return success({
            getRawClient() {
                return client;
            },
            onEvent(handler: (data: StreamElementsEvent) => void) {
                client.onEvent(handler);
            },
            onFollow(handler: (data: StreamElementsEvent) => void) {
                client.onFollow(handler);
            },
            onHost(handler: (data: StreamElementsEvent) => void) {
                client.onHost(handler);
            },
            onRaid(handler: (data: StreamElementsEvent) => void) {
                client.onRaid(handler);
            },
            onSubscriber(handler: (data: StreamElementsEvent) => void) {
                client.onSubscriber(handler);
            },
            onGift(handler: (data: StreamElementsEvent) => void) {
                client.onGift(handler);
            },
            onTip(handler: (data: StreamElementsEvent) => void) {
                client.onTip(handler);
            },
            onCheer(handler: (data: StreamElementsEvent) => void) {
                client.onCheer(handler);
            },
        });
    }

    stopClient(client: StreamElementsServiceClient) {
        client.getRawClient().close();
    }
}
