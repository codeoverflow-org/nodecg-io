import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import * as easymidi from "easymidi";

interface MidiOutputServiceConfig {
    device: string;
}

export interface MidiOutputServiceClient {
    getRawClient(): easymidi.Output;
}

module.exports = (nodecg: NodeCG): ServiceProvider<MidiOutputServiceClient> | undefined => {
    const midiService = new MidiService(nodecg, "midi-output", __dirname, "../midi-output-schema.json");
    return midiService.register();
};

class MidiService extends ServiceBundle<MidiOutputServiceConfig, MidiOutputServiceClient> {
    async validateConfig(config: MidiOutputServiceConfig): Promise<Result<void>> {
        try {
            new easymidi.Output(config.device).close();
            return emptySuccess();
        } catch (err) {
            return error(String(err));
        }
    }

    async createClient(config: MidiOutputServiceConfig): Promise<Result<MidiOutputServiceClient>> {
        this.nodecg.log.info(`Connecting to MIDI output device ${config.device}.`);
        const client = new easymidi.Output(config.device);
        this.nodecg.log.info(`Successfully connected to MIDI output device ${config.device}.`);

        return success({
            getRawClient() {
                return client;
            },
        });
    }

    stopClient(client: MidiOutputServiceClient): void {
        client.getRawClient().close();
    }
}
