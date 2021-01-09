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
        console.log("Test");
        await client.ping();
        await client.requestPermissions("gps");
        const gps = await client.getSensor("gps");
        console.log(await gps?.getLastKnownLocation());
        gps?.subscribeLocations((l) => console.log(l));
        //await client.disconnect();
        return emptySuccess();
    }

    async createClient(config: AndroidServiceConfig): Promise<Result<AndroidServiceClient>> {
        const client = new Android(config.device);
        await client.connect();
        this.nodecg.log.info("Successfully connected to adb.");
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
