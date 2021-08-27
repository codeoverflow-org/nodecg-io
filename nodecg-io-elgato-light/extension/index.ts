import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, ServiceBundle, error } from "nodecg-io-core";
import { ElgatoKeyLightClient, ElgatoLightClient, ElgatoLightStripClient, LightType } from "./elgatoLightClient";

export interface ElgatoLightConfig {
    lights: [
        {
            ipAddress: string;
            lightType: LightType;
        },
    ];
}

export { ElgatoLightClient, ElgatoKeyLightClient, ElgatoLightStripClient, LightType } from "./elgatoLightClient";

module.exports = (nodecg: NodeCG) => {
    new ElgatoLightService(nodecg, "elgato-light", __dirname, "../schema.json").register();
};

// TODO: Change signature again, should be one ElgatoLightClient with multiple lights (KeyLight|LightStrip)
class ElgatoLightService extends ServiceBundle<ElgatoLightConfig, Array<ElgatoLightClient>> {
    async validateConfig(config: ElgatoLightConfig): Promise<Result<void>> {
        for (const light of config.lights) {
            const client = this.createLightClient(light.ipAddress, light.lightType);
            const valid = await client.validate();
            if (!valid) {
                return error(`Unable to connect to elgato light with ip address: ${light.ipAddress}`);
            }
        }
        return emptySuccess();
    }

    async createClient(config: ElgatoLightConfig): Promise<Result<Array<ElgatoLightClient>>> {
        const lights = config.lights.map((light) => this.createLightClient(light.ipAddress, light.lightType));
        this.nodecg.log.info("Successfully created Elgato light client(s).");
        return success(lights);
    }

    stopClient(_: Array<ElgatoLightClient>): void {
        this.nodecg.log.info("Successfully stopped Elgato light client(s).");
    }

    private createLightClient(ipAddress: string, lightType: LightType) {
        if (lightType === "KeyLight") {
            return new ElgatoKeyLightClient(ipAddress);
        } else {
            return new ElgatoLightStripClient(ipAddress);
        }
    }
}
