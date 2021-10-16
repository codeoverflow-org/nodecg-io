import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, error, ServiceBundle } from "nodecg-io-core";
import * as easymidi from "easymidi";

interface MidiInputServiceConfig {
    device: string;
    virtual?: boolean;
}

export type MidiInputServiceClient = easymidi.Input;

module.exports = (nodecg: NodeCG) => {
    new MidiService(nodecg, "midi-input", __dirname, "../midi-input-schema.json").register();
};

class MidiService extends ServiceBundle<MidiInputServiceConfig, MidiInputServiceClient> {
    async validateConfig(config: MidiInputServiceConfig): Promise<Result<void>> {
        const devices: Array<string> = new Array<string>();

        // Virtual devices can always be created, easymidi will find a
        // free name for the matching output
        if (!config.virtual) {
            easymidi.getInputs().forEach((device) => {
                if (device.includes(config.device)) {
                    devices.push(device);
                }
            });
            if (devices.length === 0) {
                return error("No device matched the configured pattern!");
            }
            if (devices.length > 1) {
                return error("The configured pattern is ambiguous!");
            }
        }

        return emptySuccess();
    }

    async createClient(config: MidiInputServiceConfig): Promise<Result<MidiInputServiceClient>> {
        if (config.virtual) {
            this.nodecg.log.info(`Creating virtual MIDI input device ${config.device}.`);
            const client = new easymidi.Input(config.device, true);
            this.nodecg.log.info(`Successfully created virtual MIDI input device ${config.device}.`);
            return success(client);
        } else {
            this.nodecg.log.info(`Checking device name "${config.device}".`);

            let deviceName: string | null = null;
            easymidi.getInputs().forEach((device) => {
                if (device.includes(config.device) && deviceName === null) {
                    deviceName = device;
                }
            });

            this.nodecg.log.info(`Connecting to MIDI input device ${deviceName}.`);
            if (deviceName !== null) {
                const client = new easymidi.Input(deviceName);
                if (client.isPortOpen()) {
                    this.nodecg.log.info(`Successfully connected to MIDI input device ${deviceName}.`);
                    return success(client);
                }
            }
            return error("Could not connect to the configured device!");
        }
    }

    stopClient(client: MidiInputServiceClient): void {
        client.close();
    }

    removeHandlers(client: MidiInputServiceClient): void {
        client.removeAllListeners();
    }
}
