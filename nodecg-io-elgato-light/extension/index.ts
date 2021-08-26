import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { ElgatoLightClient } from "./elgatoLightClient";

export interface ElgatoLightConfig {
    placeholder: string; // TODO: Change (IP and type)
}

export { ElgatoLightClient } from "./elgatoLightClient";

module.exports = (nodecg: NodeCG) => {
    new TemplateService(nodecg, "elgato-light", __dirname, "../schema.json").register();
};

class TemplateService extends ServiceBundle<ElgatoLightConfig, ElgatoLightClient> {
    async validateConfig(_: ElgatoLightConfig): Promise<Result<void>> {
        // TODO: Implement by calling the registered IPs
        return emptySuccess();
    }

    async createClient(config: ElgatoLightConfig): Promise<Result<ElgatoLightClient>> {
        // TODO: Implement
        const client = ElgatoLightClient.createClient(config);
        this.nodecg.log.info("Successfully created Elgato light client.");
        return success(client);
    }

    stopClient(_: ElgatoLightClient): void {
        this.nodecg.log.info("Successfully stopped Elgato light client.");
    }
}
