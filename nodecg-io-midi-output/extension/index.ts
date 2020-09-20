import { NodeCG } from "nodecg/types/server";
import { ServiceClient } from "nodecg-io-core/extension/types";
import { emptySuccess, Result, success, error } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import * as easymidi from "easymidi";

interface MidiOutputServiceConfig {
    device: string;
}

export type MidiOutputServiceClient = ServiceClient<easymidi.Output>;

module.exports = (nodecg: NodeCG) => {
    new MidiService(nodecg, "midi-output", __dirname, "../midi-output-schema.json").register();
};

class MidiService extends ServiceBundle<MidiOutputServiceConfig, MidiOutputServiceClient> {
    async validateConfig(config: MidiOutputServiceConfig): Promise<Result<void>> {
        let devices: Array<string> = new Array<string>();

        easymidi.getInputs().forEach((device) => {
            if (device.includes(config.device)) {
                devices.push(device);
            }
        });

        if (devices.length == 0) {
            return error("no device matched the configured pattern.");
        }
        if (devices.length > 1) {
            return error("The configured pattern is ambiguous.");
        }
        return emptySuccess();
    }

    async createClient(config: MidiOutputServiceConfig): Promise<Result<MidiOutputServiceClient>> {
        this.nodecg.log.info(`Checking device name "${config.device}"`);
        let devices: Array<string> = new Array<string>();
        let deviceName: string | null = null;
        easymidi.getOutputs().forEach((device) => {
            if (device.includes(config.device) && deviceName == null) {
                deviceName = device;
            }
        });

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
