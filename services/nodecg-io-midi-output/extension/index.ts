import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, error, ServiceBundle, Logger } from "nodecg-io-core";
import * as easymidi from "easymidi";

interface MidiOutputServiceConfig {
    device: string;
    virtual?: boolean;
}

export type MidiOutputServiceClient = easymidi.Output;

module.exports = (nodecg: NodeCG) => {
    new MidiService(nodecg, "midi-output", __dirname, "../midi-output-schema.json").register();
};

class MidiService extends ServiceBundle<MidiOutputServiceConfig, MidiOutputServiceClient> {
    presets = Object.fromEntries(easymidi.getOutputs().map((device) => [device, { device }]));

    async validateConfig(config: MidiOutputServiceConfig): Promise<Result<void>> {
        const devices: Array<string> = new Array<string>();

        // Virtual devices can always be created, easymidi will find a
        // free name for the matching input
        if (!config.virtual) {
            easymidi.getOutputs().forEach((device) => {
                if (device.includes(config.device)) {
                    devices.push(device);
                }
            });

            if (devices.length === 0) {
                return error("No device matched the configured pattern.");
            }

            // If we have a device with the exact same name we prioritize it and use that device.
            // If we have no exact match an ambiguous pattern is not allowed.
            if (devices.length > 1 && !devices.includes(config.device)) {
                return error("The configured pattern is ambiguous.");
            }
        }

        return emptySuccess();
    }

    async createClient(config: MidiOutputServiceConfig, logger: Logger): Promise<Result<MidiOutputServiceClient>> {
        if (config.virtual) {
            logger.info(`Creating virtual MIDI output device ${config.device}.`);
            const client = new easymidi.Output(config.device, true);
            logger.info(`Successfully created virtual MIDI output device ${config.device}.`);
            return success(client);
        } else {
            logger.info(`Checking device name "${config.device}".`);

            let deviceName: string | null = null;
            const allDevices = easymidi.getOutputs();
            if (allDevices.includes(config.device)) {
                // If we have a device with the correct name we use that device.
                deviceName = config.device;
            } else {
                // Otherwise we find a device which contains the pattern.
                easymidi.getOutputs().forEach((device) => {
                    if (device.includes(config.device) && deviceName === null) {
                        deviceName = device;
                    }
                });
            }

            logger.info(`Connecting to MIDI output device ${deviceName}.`);
            if (deviceName !== null) {
                const client = new easymidi.Output(deviceName);
                if (client.isPortOpen()) {
                    logger.info(`Successfully connected to MIDI output device ${deviceName}.`);
                    return success(client);
                }
            }
            return error("Could not connect to the configured device!");
        }
    }

    stopClient(client: MidiOutputServiceClient): void {
        client.close();
    }
}
