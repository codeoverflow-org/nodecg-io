import { NodeCG } from "nodecg/types/server";
import { NodeCGIOCore } from "nodecg-io-core/extension";
import { Service, ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
const Twitter = require("twitter"); // eslint-disable-line @typescript-eslint/no-var-requires

interface TwitterServiceConfig {
    oauthConsumerKey: string;
    oauthConsumerSecret: string;
    oauthToken: string;
    oauthTokenSecret: string;
}

export interface TwitterServiceClient {
    getRawClient(): typeof Twitter;
}

module.exports = (nodecg: NodeCG): ServiceProvider<TwitterServiceClient> | undefined => {
    nodecg.log.info("Twitter bundle started");
    const core = (nodecg.extensions["nodecg-io-core"] as unknown) as NodeCGIOCore | undefined;
    if (core === undefined) {
        nodecg.log.error("nodecg-io-core isn't loaded! Twitter bundle won't function without it.");
        return undefined;
    }

    const service: Service<TwitterServiceConfig, TwitterServiceClient> = {
        schema: core.readSchema(__dirname, "../twitter-schema.json"),
        serviceType: "twitter",
        validateConfig: validateConfig,
        createClient: createClient(nodecg),
        stopClient: stopClient,
    };

    return core.registerService(service);
};

async function validateConfig(config: TwitterServiceConfig): Promise<Result<void>> {
    try {
        // Try to connect to twitter
        const client = new Twitter({
            consumer_key: config.oauthConsumerKey, // eslint-disable-line camelcase
            consumer_secret: config.oauthConsumerSecret, // eslint-disable-line camelcase
            access_token_key: config.oauthToken, // eslint-disable-line camelcase
            access_token_secret: config.oauthTokenSecret, // eslint-disable-line camelcase
        });
        // Validate credentials
        await client.get("account/verify_credentials", {});
        return emptySuccess();
    } catch (err) {
        if (err[0] && "message" in err[0]) {
            return error(err[0].message);
        }

        return error(error.toString());
    }
}

function createClient(nodecg: NodeCG): (config: TwitterServiceConfig) => Promise<Result<TwitterServiceClient>> {
    return async (config) => {
        try {
            nodecg.log.info("Connecting to twitter ...");
            const client = new Twitter({
                consumer_key: config.oauthConsumerKey, // eslint-disable-line camelcase
                consumer_secret: config.oauthConsumerSecret, // eslint-disable-line camelcase
                access_token_key: config.oauthToken, // eslint-disable-line camelcase
                access_token_secret: config.oauthTokenSecret, // eslint-disable-line camelcase
            });
            nodecg.log.info("Successfully connected to twitter!");

            return success({
                getRawClient() {
                    return client;
                },
            });
        } catch (err) {
            return error(err.toString());
        }
    };
}

function stopClient(_client: TwitterServiceClient): void {
    // You are not really able to stop the client ...
}
