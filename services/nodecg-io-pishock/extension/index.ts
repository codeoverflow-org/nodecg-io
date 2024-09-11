import NodeCG from "@nodecg/types";
import { Result, emptySuccess, success, ServiceBundle, Logger, error } from "nodecg-io-core";
import { PiShockDevice, PiShockAuthentication } from "pishock-ts";

export interface PiShockConfig {
    authentications: Array<PiShockAuthentication>;
}

export interface PiShockClient {
    connectedDevices: Array<PiShockDevice>;
}

module.exports = (nodecg: NodeCG.ServerAPI) => {
    new PiShockService(nodecg, "pishock", __dirname, "../schema.json").register();
};

class PiShockService extends ServiceBundle<PiShockConfig, PiShockClient> {
    async validateConfig(config: PiShockConfig): Promise<Result<void>> {
        for (const deviceConfig of config.authentications) {
            if (!/[0-9a-f-]+/.test(deviceConfig.apiKey)) {
                return error(`Invalid PiShock apiKey format: ${deviceConfig.apiKey}`);
            }

            if (!/[0-9A-Z]+/.test(deviceConfig.code)) {
                return error(`Invalid PiShock code format: ${deviceConfig.code}`);
            }
        }

        return emptySuccess();
    }

    async createClient(config: PiShockConfig, logger: Logger): Promise<Result<PiShockClient>> {
        const devices = config.authentications.map((c) => {
            // Set name if missing.
            c.name ??= "nodecg-io PiShock Service";
            return new PiShockDevice(c);
        });

        // Test connection and return error if any provided auth details fail to do the request.
        const connectionStates = await Promise.all(
            devices.map(async (dev) => {
                try {
                    await dev.getInfo();
                    return true;
                } catch (err) {
                    return err;
                }
            }),
        );

        for (const state of connectionStates) {
            if (state instanceof Error) {
                return error(`Failed to connect to PiShock api: ${state.message}`);
            }
        }

        const client = { connectedDevices: devices };
        logger.info("Successfully created PiShock client.");
        return success(client);
    }

    stopClient(_: PiShockClient, _logger: Logger): void {
        // Stateless REST API, cannot be stopped
    }
}
