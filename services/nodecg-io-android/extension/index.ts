import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle, Logger } from "nodecg-io-core";
import { Android } from "./android";

interface AndroidServiceConfig {
    device: string;
}

export type AndroidServiceClient = Android;

module.exports = (nodecg: NodeCG) => {
    new AndroidService(nodecg, "android", __dirname, "../android-schema.json").register();
};

class AndroidService extends ServiceBundle<AndroidServiceConfig, AndroidServiceClient> {
    async validateConfig(config: AndroidServiceConfig, logger: Logger): Promise<Result<void>> {
        const client = new Android(logger, config.device);
        await client.connect();
        await client.disconnect();
        return emptySuccess();
    }

    async createClient(config: AndroidServiceConfig, logger: Logger): Promise<Result<AndroidServiceClient>> {
        const client = new Android(logger, config.device);
        await client.connect();
        logger.info("Successfully connected to adb.");
        return success(client);
    }

    async stopClient(client: AndroidServiceClient, logger: Logger): Promise<void> {
        try {
            await client.disconnect();
        } catch (err) {
            logger.error(err);
            // Do nothing. If we did not catch it it'd cause an infinite loop.
        }
    }
}
