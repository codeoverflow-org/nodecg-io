import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, ServiceBundle, error } from "nodecg-io-core";
import { NanoleafClient } from "./nanoleafClient";
import { NanoleafUtils } from "./nanoleafUtils";

export interface NanoleafServiceConfig {
    authKey?: string;
    ipAddress: string;
}

// Reexporting all important classes
export { NanoleafClient as NanoleafServiceClient } from "./nanoleafClient";
export { NanoleafUtils } from "./nanoleafUtils";
export { Color, ColoredPanel, PanelEffect } from "./interfaces";
export { NanoleafQueue } from "./nanoleafQueue";

module.exports = (nodecg: NodeCG) => {
    new NanoleafService(nodecg, "nanoleaf", __dirname, "../nanoleaf-schema.json").register();
};

class NanoleafService extends ServiceBundle<NanoleafServiceConfig, NanoleafClient> {
    async validateConfig(config: NanoleafServiceConfig): Promise<Result<void>> {
        // checks for valid IP Adress or valid IP Adress + Auth Key separately
        if (!config.authKey) {
            if (await NanoleafUtils.verifyIpAddress(config.ipAddress)) {
                this.nodecg.log.info("Successfully verified ip address. Now trying to retrieve an auth key for you...");

                // Automatically retrieves and saves the auth key for user's convenience
                const authKey = await NanoleafUtils.retrieveAuthKey(config.ipAddress, this.nodecg);
                if (authKey !== "") {
                    config.authKey = authKey;
                    return emptySuccess();
                } else {
                    return error("Unable to retrieve auth key!");
                }
            } else {
                return error("Unable to call the specified ip address!");
            }
        } else {
            if (await NanoleafUtils.verifyAuthKey(config.ipAddress, config.authKey)) {
                this.nodecg.log.info("Successfully verified auth key.");
                return emptySuccess();
            } else {
                return error("Unable to verify auth key! Invalid key?");
            }
        }
    }

    async createClient(config: NanoleafServiceConfig): Promise<Result<NanoleafClient>> {
        this.nodecg.log.info("Connecting to nanoleaf controller...");
        if (await NanoleafUtils.verifyAuthKey(config.ipAddress, config.authKey || "")) {
            const client = new NanoleafClient(config.ipAddress, config.authKey || "");
            this.nodecg.log.info("Connected to Nanoleafs successfully.");
            return success(client);
        } else {
            return error("Unable to connect to Nanoleafs! Please check your credentials!");
        }
    }

    stopClient(): void {
        // There is really nothing to do here
        this.nodecg.log.info("Successfully stopped nanoleaf client.");
    }
}
