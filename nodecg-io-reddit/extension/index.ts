import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import RedditAPI from "reddit-ts";

interface RedditServiceConfig {
    clientId: string;
    clientSecret: string;
    username: string;
    password: string;
}

export type RedditServiceClient = RedditAPI;

module.exports = (nodecg: NodeCG) => {
    new RedditService(nodecg, "reddit", __dirname, "../reddit-schema.json").register();
};

class RedditService extends ServiceBundle<RedditServiceConfig, RedditServiceClient> {
    private buildCredentials(config: RedditServiceConfig) {
        return {
            user_agent: "nodecg-io",
            o2a: {
                client_id: config.clientId,
                client_secret: config.clientSecret,
                username: config.username,
                password: config.password,
            },
        };
    }

    async validateConfig(config: RedditServiceConfig): Promise<Result<void>> {
        const client = new RedditAPI(this.buildCredentials(config));
        await client.me();
        return emptySuccess();
    }

    async createClient(config: RedditServiceConfig): Promise<Result<RedditServiceClient>> {
        const client = new RedditAPI(this.buildCredentials(config));
        await client.me();
        this.nodecg.log.info("Successfully connected to reddit.");
        return success(client);
    }

    stopClient(_client: RedditServiceClient): void {
        // Nothing to do.
    }
}
