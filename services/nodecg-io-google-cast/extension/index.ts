import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle, Logger } from "nodecg-io-core";
import { GoogleCastClient } from "./castClient";
import ChromecastAPI from "chromecast-api";

export interface GoogleCastConfig {
    name?: string;
    friendlyName?: string;
    host: string;
}

export { GoogleCastClient } from "./castClient";

module.exports = (nodecg: NodeCG) => {
    new GoogleCastService(nodecg).register();
};

class GoogleCastService extends ServiceBundle<GoogleCastConfig, GoogleCastClient> {
    private autoDiscoveryClient = new ChromecastAPI();

    constructor(nodecg: NodeCG) {
        super(nodecg, "google-cast", __dirname, "../schema.json");

        this.autoDiscoveryClient.on("device", (device) => {
            if (this.presets === undefined) this.presets = {};

            this.presets[device.friendlyName] = {
                name: device.name,
                friendlyName: device.friendlyName,
                host: device.host,
            };
        });
    }

    async validateConfig(_: GoogleCastConfig): Promise<Result<void>> {
        return emptySuccess();
    }

    async createClient(config: GoogleCastConfig, logger: Logger): Promise<Result<GoogleCastClient>> {
        const client = await GoogleCastClient.createClient(config);
        logger.info("Successfully created google-cast client.");
        return success(client);
    }

    stopClient(client: GoogleCastClient, logger: Logger): void {
        client.close();
        logger.info("Successfully stopped google-cast client.");
    }

    removeHandlers(client: GoogleCastClient): void {
        client.removeAllListeners();
    }
}
