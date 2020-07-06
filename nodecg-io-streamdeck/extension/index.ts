import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { StreamDeck } from "elgato-stream-deck";
import * as streamdeck from "elgato-stream-deck";

interface StreamdeckServiceConfig {
    device: string;
}

export interface StreamdeckServiceClient {
    getRawClient(): StreamDeck;
}

module.exports = (nodecg: NodeCG): ServiceProvider<StreamdeckServiceClient> | undefined => {
    const service = new StreamdeckServiceBundle(nodecg, "streamdeck", __dirname, "streamdeck-schema.json");
    return service.register();
};

class StreamdeckServiceBundle extends ServiceBundle<StreamdeckServiceConfig, StreamdeckServiceClient> {
    async validateConfig(config: StreamdeckServiceConfig): Promise<Result<void>> {
        try {
            let device: string | undefined = config.device;
            if (device === "default") {
                device = undefined;
            }
            streamdeck.openStreamDeck(device).close(); // Throws an error if the streamdeck is not found
            return emptySuccess();
        } catch (err) {
            return error(err.toString());
        }
    }

    async createClient(config: StreamdeckServiceConfig): Promise<Result<StreamdeckServiceClient>> {
        try {
            let device: string | undefined = config.device;
            if (device === "default") {
                device = undefined;
            }

            this.nodecg.log.info(`Connecting to the streamdeck ${config.device}.`);
            const deck = streamdeck.openStreamDeck(device);
            this.nodecg.log.info(`Successfully connected to the streamdeck ${config.device}.`);

            return success({
                getRawClient() {
                    return deck;
                },
            });
        } catch (err) {
            return error(err.toString());
        }
    }

    stopClient(client: StreamdeckServiceClient): void {
        client.getRawClient().close();
    }
}
