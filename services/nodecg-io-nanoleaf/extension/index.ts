import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle, error, Logger } from "nodecg-io-core";
import { NanoleafClient } from "./nanoleafClient";
import { NanoleafUtils } from "./nanoleafUtils";

export interface NanoleafServiceConfig {
    authKey?: string;
    ipAddress: string;
}

// Reexportation of important classes and types is done in ../index.ts because we need to
// export NanoleafUtils which is a class and this file already has a default export for nodecg.

module.exports = (nodecg: NodeCG) => {
    new NanoleafService(nodecg, "nanoleaf", __dirname, "../nanoleaf-schema.json").register();
};

class NanoleafService extends ServiceBundle<NanoleafServiceConfig, NanoleafClient> {
    async validateConfig(config: NanoleafServiceConfig, logger: Logger): Promise<Result<void>> {
        // checks for valid IP Adress or valid IP Adress + Auth Key separately
        if (!config.authKey) {
            if (await NanoleafUtils.verifyIpAddress(config.ipAddress)) {
                logger.info("Successfully verified ip address. Now trying to retrieve an auth key for you...");

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
                logger.info("Successfully verified auth key.");
                return emptySuccess();
            } else {
                return error("Unable to verify auth key! Invalid key?");
            }
        }
    }

    async createClient(config: NanoleafServiceConfig, logger: Logger): Promise<Result<NanoleafClient>> {
        logger.info("Connecting to nanoleaf controller...");
        if (await NanoleafUtils.verifyAuthKey(config.ipAddress, config.authKey || "")) {
            const client = new NanoleafClient(config.ipAddress, config.authKey || "");
            logger.info("Connected to Nanoleafs successfully.");
            return success(client);
        } else {
            return error("Unable to connect to Nanoleafs! Please check your credentials!");
        }
    }

    stopClient(_: NanoleafClient, logger: Logger): void {
        // There is really nothing to do here
        logger.info("Successfully stopped nanoleaf client.");
    }
}
