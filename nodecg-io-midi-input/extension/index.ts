import { NodeCG } from "nodecg/types/server";
import { emptySuccess, Result, success } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import * as easymidi from "easymidi";

interface MidiInputServiceConfig {
    device: string;
}

export interface MidiInputServiceClient {
    getRawClient(): easymidi.Input;
}

module.exports = (nodecg: NodeCG) => {
    new MidiService(nodecg, "midi-input", __dirname, "../midi-input-schema.json").register();
};

class MidiService extends ServiceBundle<MidiInputServiceConfig, MidiInputServiceClient> {
    async validateConfig(config: MidiInputServiceConfig): Promise<Result<void>> {
        new easymidi.Input(config.device).close();
        return emptySuccess();
    }

    async createClient(config: MidiInputServiceConfig): Promise<Result<MidiInputServiceClient>> {
        this.nodecg.log.info(`Connecting to MIDI input device ${config.device}.`);
        const client = new easymidi.Input(config.device);
        this.nodecg.log.info(`Successfully connected to MIDI input device ${config.device}.`);

        return success({
            getRawClient() {
                return client;
            },
        });
    }

    stopClient(client: MidiInputServiceClient): void {
        client.getRawClient().close();
    }
}
