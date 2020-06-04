import { NodeCG } from "nodecg/types/server";
import { NodeCGIOCore } from "nodecg-io-core/extension";
import { Service, ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
import * as fs from "fs";
import * as path from "path";
import TwitchClient from "twitch";
import ChatClient from "twitch-chat-client";

interface TwitchServiceConfig {
    oauthKey: string
}

export interface TwitchServiceClient {
    getRawClient(): ChatClient
}

module.exports = (nodecg: NodeCG): ServiceProvider<TwitchServiceClient> | undefined => {
    nodecg.log.info("Twitch bundle started");
    const core: NodeCGIOCore = nodecg.extensions["nodecg-io-core"] as any;
    if (core === undefined) {
        nodecg.log.error("nodecg-io-core isn't loaded! Twitch bundle won't function without it.");
        return undefined;
    }

    const service: Service<TwitchServiceConfig, TwitchServiceClient> = {
        schema: fs.readFileSync(path.resolve(__dirname, "../twitch-schema.json"), "utf8"),
        serviceType: "twitch",
        validateConfig: validateConfig,
        createClient: createClient(nodecg)
    };

    return core.registerService(service);
};

async function validateConfig(config: TwitchServiceConfig): Promise<Result<void>> {
    try {
        const authKey = config.oauthKey.replace("oauth:", "");
        await TwitchClient.getTokenInfo(authKey); // This will throw a error if the token is invalid
        return emptySuccess();
    } catch (err) {
        return error(err.toString());
    }
}

function createClient(nodecg: NodeCG): (config: TwitchServiceConfig) => Promise<Result<TwitchServiceClient>> {
    return async (config) => {
        try {
            // This twitch client needs the token without the "oauth:" before the actual token, strip it away
            const authKey = config.oauthKey.replace("oauth:", "");
            // Create a twitch authentication client
            const tokenInfo = await TwitchClient.getTokenInfo(authKey);
            const authClient = TwitchClient.withCredentials(tokenInfo.clientId, authKey, tokenInfo.scopes);

            // Create the actual chat client and connect
            const chatClient = ChatClient.forTwitchClient(authClient);
            nodecg.log.info("Connecting to twitch chat...");
            await chatClient.connect();
            nodecg.log.info("Successfully connected to twitch.");

            return success({
                getRawClient() {
                    return chatClient;
                }
            });
        } catch (err) {
            return error(err.toString());
        }
    };
}