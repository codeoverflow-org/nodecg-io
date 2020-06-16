import { NodeCG } from "nodecg/types/server";
import { NodeCGIOCore } from "nodecg-io-core/extension";
import { Service, ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";

import * as fs from "fs";
import * as path from "path";

import { StreamElements } from './StreamElements';


interface StreamElementsServiceConfig {
    jwtToken: string,
    accountId: string
}

export interface StreamElementsServiceClient {
    getRawClient(): StreamElements
}

module.exports = (nodecg: NodeCG): ServiceProvider<StreamElementsServiceClient> | undefined => {
    nodecg.log.info("StreamElements bundle started");
    const core: NodeCGIOCore | undefined = nodecg.extensions["nodecg-io-core"] as any;
    if (core === undefined) {
        nodecg.log.error("nodecg-io-core isn't loaded! StreamElements bundle won't function without it.");
        return undefined;
    }

    const service: Service<StreamElementsServiceConfig, StreamElementsServiceClient> = {
        schema: fs.readFileSync(path.resolve(__dirname, "../streamelements-schema.json"), "utf8"),
        serviceType: "streamelements",
        validateConfig: validateConfig,
        createClient: createClient(nodecg),
        stopClient: stopClient
    };

    return core.registerService(service);
};

async function validateConfig(config: StreamElementsServiceConfig): Promise<Result<void>> {
    return StreamElements.test(config);
}

function createClient(nodecg: NodeCG): (config: StreamElementsServiceConfig) => Promise<Result<StreamElementsServiceClient>> {
    return async (config) => {
        try {
            //Tokens
            const jwtToken = config.jwtToken;
            const accountId = config.accountId;
            
            // Create the actual client and connect
            //const chatClient = ChatClient.forTwitchClient(authClient);
            const client = new StreamElements({jwtToken, accountId});
            nodecg.log.info("Connecting to StreamElements socket server...");
            await client.connect(); // Connects to StreamElements socket server
            // This also waits till it has registered itself at the StreamElements socket server, which is needed to do anything.
            await new Promise((resolve, _reject) => {
                client.onRegister(resolve);
            })
            nodecg.log.info("Successfully connected to StreamElements socket server.");

            return success({
                getRawClient() {
                    return client;
                }
            });
        } catch (err) {
            return error(err.toString());
        }
    };
}

function stopClient(client: StreamElementsServiceClient): void {
    client.getRawClient().close();
}