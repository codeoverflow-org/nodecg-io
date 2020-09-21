import { NodeCG } from "nodecg/types/server";
import { ServiceClient } from "nodecg-io-core/extension/types";
import { emptySuccess, Result, success, error } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import * as easymidi from "easymidi";

interface MidiInputServiceConfig {
    device: string;
}

export type MidiInputServiceClient = ServiceClient<easymidi.Input>;

module.exports = (nodecg: NodeCG) => {
    new MidiService(nodecg, "midi-input", __dirname, "../midi-input-schema.json").register();
};

class MidiService extends ServiceBundle<MidiInputServiceConfig, MidiInputServiceClient> {
    async validateConfig(config: MidiInputServiceConfig): Promise<Result<void>> {
        const devices: Array<string> = new Array<string>();

        easymidi.getInputs().forEach((device) => {
            if (device.includes(config.device)) {
                devices.push(device);
            }
        });

        if (devices.length === 0) {
            return error("No device matched the configured pattern.");
        }
        if (devices.length > 1) {
            return error("The configured pattern is ambiguous.");
        }
        return emptySuccess();
    }

    async createClient(config: MidiInputServiceConfig): Promise<Result<MidiInputServiceClient>> {
        this.nodecg.log.info(`Checking device name "${config.device}"`);
        const devices: Array<string> = new Array<string>();
        let deviceName: string | null = null;
        easymidi.getInputs().forEach((device) => {
            if (device.includes(config.device) && deviceName == null) {
                deviceName = device;
            }
        });

        this.nodecg.log.info(`Connecting to MIDI input device ${deviceName}.`);
        const client = new easymidi.Input(config.device);
        this.nodecg.log.info(`Successfully connected to MIDI input device ${config.device}.`);

        return success({
            getNativeClient() {
                return client;
            },
        });
    }

    stopClient(client: MidiInputServiceClient): void {
        client.getNativeClient().close();
    }
}
