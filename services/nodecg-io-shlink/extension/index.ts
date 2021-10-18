import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { ShlinkClient } from "shlink-client";

interface ShlinkServiceConfig {
    url: string;
    apiKey: string;
}

export type ShlinkServiceClient = ShlinkClient;

module.exports = (nodecg: NodeCG) => {
    new ShlinkService(nodecg, "shlink", __dirname, "../shlink-schema.json").register();
};

class ShlinkService extends ServiceBundle<ShlinkServiceConfig, ShlinkServiceClient> {
    async validateConfig(config: ShlinkServiceConfig): Promise<Result<void>> {
        const client = new ShlinkClient({ url: config.url, token: config.apiKey });

        await client.countVisits(); // will throw a meaningful error if something went wrong
        return emptySuccess();
    }

    async createClient(config: ShlinkServiceConfig): Promise<Result<ShlinkServiceClient>> {
        const client = new ShlinkClient({ url: config.url, token: config.apiKey });
        return success(client);
    }

    stopClient(_client: ShlinkServiceClient): void {
        // not needed or possible
    }
}
