import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, error, ServiceBundle } from "nodecg-io-core";
import * as streamdeck from "@elgato-stream-deck/node";
import { StreamDeck } from "@elgato-stream-deck/node";

interface StreamdeckServiceConfig {
    device: string;
}

export type StreamdeckServiceClient = StreamDeck;

module.exports = (nodecg: NodeCG) => {
    new StreamdeckServiceBundle(nodecg, "streamdeck", __dirname, "../streamdeck-schema.json").register();
};

class StreamdeckServiceBundle extends ServiceBundle<StreamdeckServiceConfig, StreamdeckServiceClient> {
    presets = Object.fromEntries(this.buildPresets());

    private buildPresets(): Array<[string, StreamdeckServiceConfig]> {
        const decks = streamdeck.listStreamDecks();
        return decks.map((deck) => {
            const presetName = `${deck.model}@${deck.path}`;
            const presetConfig = { device: deck.path };
            return [presetName, presetConfig];
        });
    }

    async validateConfig(config: StreamdeckServiceConfig): Promise<Result<void>> {
        try {
            let device: string | undefined = config.device;
            if (device === "default") {
                device = undefined;
            }
            streamdeck.openStreamDeck(device).close(); // Throws an error if the streamdeck is not found
            return emptySuccess();
        } catch (err) {
            return error(String(err));
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
