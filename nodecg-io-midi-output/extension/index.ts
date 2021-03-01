import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, error, ServiceBundle } from "nodecg-io-core";
import * as easymidi from "easymidi";

interface MidiOutputServiceConfig {
    device: string;
}

export type MidiOutputServiceClient = easymidi.Output;

module.exports = (nodecg: NodeCG) => {
    new MidiService(nodecg, "midi-output", __dirname, "../midi-output-schema.json").register();
};

class MidiService extends ServiceBundle<MidiOutputServiceConfig, MidiOutputServiceClient> {
    async validateConfig(config: MidiOutputServiceConfig): Promise<Result<void>> {
        const devices: Array<string> = new Array<string>();

        easymidi.getOutputs().forEach((device) => {
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

    async createClient(config: MidiOutputServiceConfig): Promise<Result<MidiOutputServiceClient>> {
        this.nodecg.log.info(`Checking device name "${config.device}".`);
        let deviceName: string | null = null;
        easymidi.getOutputs().forEach((device) => {
            if (device.includes(config.device) && deviceName === null) {
                deviceName = device;
            }
        });

        this.nodecg.log.info(`Connecting to MIDI output device ${deviceName}.`);
        if (deviceName !== null) {
            const client = new easymidi.Output(deviceName);
            this.nodecg.log.info(`Successfully connected to MIDI output device ${deviceName}.`);

            return success(client);
        } else {
            return error("Could not connect to the configured device!");
        }
    }

    stopClient(client: MidiOutputServiceClient): void {
        client.close();
    }
}
