import { NodeCG } from "nodecg/types/server";
import { NodeCGIOCore } from "nodecg-io-core/extension";
import { Service, ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
import { StreamDeck } from "elgato-stream-deck";
import * as streamdeck from "elgato-stream-deck";

interface StreamdeckServiceConfig {
    device: string;
}

export interface StreamdeckServiceClient {
    getRawClient(): StreamDeck;
}

module.exports = (nodecg: NodeCG): ServiceProvider<StreamdeckServiceClient> | undefined => {
    nodecg.log.info("Streamdeck bundle started");
    const core = (nodecg.extensions["nodecg-io-core"] as unknown) as NodeCGIOCore | undefined;
    if (core === undefined) {
        nodecg.log.error("nodecg-io-core isn't loaded! Streamdeck bundle won't function without it.");
        return undefined;
    }

    const service: Service<StreamdeckServiceConfig, StreamdeckServiceClient> = {
        schema: core.readSchema(__dirname, "../streamdeck-schema.json"),
        serviceType: "streamdeck",
        validateConfig: validateConfig,
        createClient: createClient(nodecg),
        stopClient: stopClient,
    };

    return core.registerService(service);
};

async function validateConfig(config: StreamdeckServiceConfig): Promise<Result<void>> {
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

function createClient(nodecg: NodeCG): (config: StreamdeckServiceConfig) => Promise<Result<StreamdeckServiceClient>> {
    return async (config) => {
        try {
            let device: string | undefined = config.device;
            if (device === "default") {
                device = undefined;
            }

            nodecg.log.info(`Connecting to the streamdeck ${config.device}.`);
            const deck = streamdeck.openStreamDeck(device);
            nodecg.log.info(`Successfully connected to the streamdeck ${config.device}.`);

            return success({
                getRawClient() {
                    return deck;
                },
            });
        } catch (err) {
            return error(err.toString());
        }
    };
}

function stopClient(client: StreamdeckServiceClient): void {
    client.getRawClient().close();
}
