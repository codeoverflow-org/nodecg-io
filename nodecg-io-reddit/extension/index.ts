import { NodeCG } from "nodecg/types/server";
import { ServiceClient } from "nodecg-io-core/extension/types";
import { emptySuccess, success, Result } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import RedditAPI from "reddit-ts";

interface RedditServiceConfig {
    clientId: string;
    clientSecret: string;
    username: string;
    password: string;
}

export type RedditServiceClient = ServiceClient<RedditAPI>;

module.exports = (nodecg: NodeCG) => {
    new RedditService(nodecg, "reddit", __dirname, "../reddit-schema.json").register();
};

class RedditService extends ServiceBundle<RedditServiceConfig, RedditServiceClient> {
    async validateConfig(config: RedditServiceConfig): Promise<Result<void>> {
        const credentials = {
            user_agent: "nodecg-io",
            o2a: {
                client_id: config.clientId,
                client_secret: config.clientSecret,
                username: config.username,
                password: config.password,
            },
        };
        const client = new RedditAPI(credentials);
        await client.me();
        return emptySuccess();
    }

    async createClient(config: RedditServiceConfig): Promise<Result<RedditServiceClient>> {
        const credentials = {
            user_agent: "nodecg-io",
            o2a: {
                client_id: config.clientId,
                client_secret: config.clientSecret,
                username: config.username,
                password: config.password,
            },
        };
        const client = new RedditAPI(credentials);
        await client.me();
        this.nodecg.log.info("Successfully connected to reddit.");
        return success({
            getNativeClient() {
                return client;
            },
        });
    }

    stopClient(_client: RedditServiceClient): void {
        // Nothing to do.
    }
}
