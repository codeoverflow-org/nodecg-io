import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import Twitter = require("twitter");

interface TwitterServiceConfig {
    oauthConsumerKey: string;
    oauthConsumerSecret: string;
    oauthToken: string;
    oauthTokenSecret: string;
}

export type TwitterServiceClient = Twitter;

module.exports = (nodecg: NodeCG) => {
    new TwitterService(nodecg, "twitter", __dirname, "../twitter-schema.json").register();
};

class TwitterService extends ServiceBundle<TwitterServiceConfig, TwitterServiceClient> {
    async validateConfig(config: TwitterServiceConfig): Promise<Result<void>> {
        // Connect to twitter
        const client = new Twitter({
            consumer_key: config.oauthConsumerKey, // eslint-disable-line camelcase
            consumer_secret: config.oauthConsumerSecret, // eslint-disable-line camelcase
            access_token_key: config.oauthToken, // eslint-disable-line camelcase
            access_token_secret: config.oauthTokenSecret, // eslint-disable-line camelcase
        });
        // Validate credentials
        await client.get("account/verify_credentials", {});
        return emptySuccess();
    }

    async createClient(config: TwitterServiceConfig): Promise<Result<TwitterServiceClient>> {
        this.nodecg.log.info("Connecting to twitter...");
        const client = new Twitter({
            consumer_key: config.oauthConsumerKey, // eslint-disable-line camelcase
            consumer_secret: config.oauthConsumerSecret, // eslint-disable-line camelcase
            access_token_key: config.oauthToken, // eslint-disable-line camelcase
            access_token_secret: config.oauthTokenSecret, // eslint-disable-line camelcase
        });
        this.nodecg.log.info("Successfully connected to twitter.");

        return success(client);
    }

    stopClient(_client: TwitterServiceClient): void {
        // You are not really able to stop the client ...
    }
}
