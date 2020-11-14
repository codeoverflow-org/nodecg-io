import { NodeCG } from "nodecg/types/server";
import { ServiceClient } from "nodecg-io-core/extension/types";
import { emptySuccess, success, Result } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { Android } from "./android";

interface AndroidServiceConfig {
    device: string;
}

export type AndroidServiceClient = ServiceClient<Android>;

module.exports = (nodecg: NodeCG) => {
    new AndroidService(nodecg, "android", __dirname, "../android-schema.json").register();
};

class AndroidService extends ServiceBundle<AndroidServiceConfig, AndroidServiceClient> {
    async validateConfig(config: AndroidServiceConfig): Promise<Result<void>> {
        const client = new Android(config.device);
        await client.connect();
        await client.ping();
        await client.disconnect();
        return emptySuccess();
    }

    async createClient(config: AndroidServiceConfig): Promise<Result<AndroidServiceClient>> {
        const client = new Android(config.device);
        await client.connect();
        this.nodecg.log.info("Successfully connected to adb.");
        await client.notify(
            "Test",
            "Dies ist ein test. YAY",
            {
                importance: "high",
                mode: "public",
                bypass_dnd: true,
                auto_hide: false,
            },
            () => {
                console.log("IT WAS CLICKED!!!");
            },
        );
        this.nodecg.log.info("Test code done.");
        return success({
            getNativeClient() {
                return client;
            },
        });
    }

    async stopClient(client: AndroidServiceClient): Promise<void> {
        try {
            const rawClient = client.getNativeClient();
            await rawClient.disconnect();
        } catch (err) {
            this.nodecg.log.error(err);
            // Do nothing. If we did not catch it it's cause an infinite loop.
        }
    }
}
