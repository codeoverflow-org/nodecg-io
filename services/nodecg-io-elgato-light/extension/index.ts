import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle, error, Logger } from "nodecg-io-core";
import { ElgatoLightClient, ElgatoLightConfig } from "./elgatoLightClient";

export { ElgatoLight, ElgatoKeyLight, ElgatoLightStrip, LightType } from "./elgatoLight";
export { ElgatoLightClient, ElgatoLightConfig } from "./elgatoLightClient";

module.exports = (nodecg: NodeCG) => {
    new ElgatoLightService(nodecg, "elgato-light", __dirname, "../schema.json").register();
};

class ElgatoLightService extends ServiceBundle<ElgatoLightConfig, ElgatoLightClient> {
    async validateConfig(config: ElgatoLightConfig): Promise<Result<void>> {
        const notReachableLights = await new ElgatoLightClient(config).identifyNotReachableLights();
        if (notReachableLights.length === 0) {
            return emptySuccess();
        }

        return error(`Unable to connect to the lights with the following IPs: ${notReachableLights.join(", ")}`);
    }

    async createClient(config: ElgatoLightConfig, logger: Logger): Promise<Result<ElgatoLightClient>> {
        const client = new ElgatoLightClient(config);
        logger.info("Successfully created Elgato light clients.");
        return success(client);
    }

    stopClient(_: ElgatoLightClient, logger: Logger): void {
        logger.info("Successfully stopped Elgato light clients.");
    }
}
