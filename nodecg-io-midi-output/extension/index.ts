import { NodeCG } from "nodecg/types/server";
import { ServiceProvider, ServiceClient } from "nodecg-io-core/extension/types";
import { emptySuccess, success, Result } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import * as easymidi from "easymidi";

interface MidiOutputServiceConfig {
    device: string;
}

export type MidiOutputServiceClient = ServiceClient<easymidi.Output>;

module.exports = (nodecg: NodeCG): ServiceProvider<MidiOutputServiceClient> | undefined => {
    const midiService = new MidiService(nodecg, "midi-output", __dirname, "../midi-output-schema.json");
    return midiService.register();
};

class MidiService extends ServiceBundle<MidiOutputServiceConfig, MidiOutputServiceClient> {
    async validateConfig(config: MidiOutputServiceConfig): Promise<Result<void>> {
        new easymidi.Output(config.device).close();
        return emptySuccess();
    }

    async createClient(config: MidiOutputServiceConfig): Promise<Result<MidiOutputServiceClient>> {
        this.nodecg.log.info(`Connecting to MIDI output device ${config.device}.`);
        const client = new easymidi.Output(config.device);
        this.nodecg.log.info(`Successfully connected to MIDI output device ${config.device}.`);

        return success({
            getNativeClient() {
                return client;
            },
        });
    }

    stopClient(client: MidiOutputServiceClient): void {
        client.getNativeClient().close();
    }
}
