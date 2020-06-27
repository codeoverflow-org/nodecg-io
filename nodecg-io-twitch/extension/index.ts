import { NodeCG } from "nodecg/types/server";
import { NodeCGIOCore } from "nodecg-io-core/extension";
import { Service, ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
import TwitchClient from "twitch";
import ChatClient from "twitch-chat-client";

interface TwitchServiceConfig {
    oauthKey: string;
}

export interface TwitchServiceClient {
    getRawClient(): ChatClient;
}

module.exports = (nodecg: NodeCG): ServiceProvider<TwitchServiceClient> | undefined => {
    nodecg.log.info("Twitch bundle started");
    const core = (nodecg.extensions["nodecg-io-core"] as unknown) as NodeCGIOCore | undefined;
    if (core === undefined) {
        nodecg.log.error("nodecg-io-core isn't loaded! Twitch bundle won't function without it.");
        return undefined;
    }

    const service: Service<TwitchServiceConfig, TwitchServiceClient> = {
        schema: core.readSchema(__dirname, "../twitch-schema.json"),
        serviceType: "twitch",
        validateConfig: validateConfig,
        createClient: createClient(nodecg),
        stopClient: stopClient,
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
            await chatClient.connect(); // Connects to twitch IRC
            // This also waits till it has registered itself at the IRC server, which is needed to do anything.
            await new Promise((resolve, _reject) => {
                chatClient.onRegister(resolve);
            });
            nodecg.log.info("Successfully connected to twitch.");

            return success({
                getRawClient() {
                    return chatClient;
                },
            });
        } catch (err) {
            return error(err.toString());
        }
    };
}

function stopClient(client: TwitchServiceClient): void {
    // quit currently doesn't work, so we settle for removeListener for now til the fix for that bug is in a stable version.
    // See https://github.com/d-fischer/twitch/issues/128,
    // https://github.com/d-fischer/twitch/commit/3d01210ff4592220f00f9e060f4cb47783808e7b
    // and https://github.com/d-fischer/connection/commit/667634415efdbdbfbd095a160c125a81edd8ec6a
    client.getRawClient().removeListener();
    // client.getRawClient().quit()
    //     .then(r => console.log("Stopped twitch client successfully."))
}
