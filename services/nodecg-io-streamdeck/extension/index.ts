import NodeCG from "@nodecg/types";
import { Result, emptySuccess, success, error, ServiceBundle, Logger } from "nodecg-io-core";
import * as streamdeck from "@elgato-stream-deck/node";
import { StreamDeck } from "@elgato-stream-deck/node";

interface StreamdeckServiceConfig {
    device: string;
}

export type StreamdeckServiceClient = StreamDeck;

module.exports = (nodecg: NodeCG.ServerAPI) => {
    new StreamdeckServiceBundle(nodecg, "streamdeck", __dirname, "../streamdeck-schema.json").register();
};

class StreamdeckServiceBundle extends ServiceBundle<StreamdeckServiceConfig, StreamdeckServiceClient> {
    constructor(nodecg: NodeCG.ServerAPI, serviceType: string, serviceConfigName: string, schemaPath: string) {
        super(nodecg, serviceType, serviceConfigName, schemaPath);
        this.buildPresets()
            .then((presets) => (this.presets = Object.fromEntries(presets)))
            .catch((err) => nodecg.log.error("Failed to build presets for the streamdeck service:", err));
    }

    private async buildPresets() {
        const decks = await streamdeck.listStreamDecks();
        return decks.map((deck) => {
            const presetName = `${deck.model}@${deck.path}`;
            const presetConfig = { device: deck.path };
            return [presetName, presetConfig];
        });
    }

    private async getDeviceOrDefault(config: StreamdeckServiceConfig): Promise<Result<string>> {
        let device: string | undefined = config.device;
        if (device === "default") {
            const decks = await streamdeck.listStreamDecks();
            if (!decks[0]) {
                return error("No connected streamdeck found");
            }

            device = decks[0]?.path;
        }

        return success(device);
    }

    async validateConfig(config: StreamdeckServiceConfig): Promise<Result<void>> {
        try {
            const device = await this.getDeviceOrDefault(config);
            if (device.failed) {
                return device;
            }

            const deck = await streamdeck.openStreamDeck(device.result); // Throws an error if the streamdeck is not found
            deck.close();
            return emptySuccess();
        } catch (err) {
            return error(String(err));
        }
    }

    async createClient(config: StreamdeckServiceConfig, logger: Logger): Promise<Result<StreamdeckServiceClient>> {
        try {
            const device = await this.getDeviceOrDefault(config);
            if (device.failed) {
                return device;
            }

            logger.info(`Connecting to the streamdeck ${config.device}.`);
            const deck = await streamdeck.openStreamDeck(device.result);
            logger.info(`Successfully connected to the streamdeck ${config.device}.`);

            return success(deck);
        } catch (err) {
            return error(String(err));
        }
    }

    stopClient(client: StreamdeckServiceClient): void {
        client.close();
    }

    // Can't remove handlers for up/down/error, so re-create the client to get rid of the listeners
    reCreateClientToRemoveHandlers = true;
}
