import { NodeCG } from "nodecg/types/server";
import { NodeCGIOCore } from "nodecg-io-core/extension";
import { Service, ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
import { Client } from "discord.js";

interface DiscordServiceConfig {
    botToken: string;
}

export interface DiscordServiceClient {
    getRawClient(): Client;
}

module.exports = (nodecg: NodeCG): ServiceProvider<DiscordServiceClient> | undefined => {
    nodecg.log.info("Discord bundle started");
    const core = (nodecg.extensions["nodecg-io-core"] as unknown) as NodeCGIOCore | undefined;
    if (core === undefined) {
        nodecg.log.error("nodecg-io-core isn't loaded! Discord bundle won't function without it.");
        return undefined;
    }

    const service: Service<DiscordServiceConfig, DiscordServiceClient> = {
        schema: core.readSchema(__dirname, "../discord-schema.json"),
        serviceType: "discord",
        validateConfig: validateConfig,
        createClient: createClient(nodecg),
        stopClient: stopClient,
    };

    return core.registerService(service);
};

async function validateConfig(config: DiscordServiceConfig): Promise<Result<void>> {
    try {
        const botToken = config.botToken;
        const client = new Client();
        await client.login(botToken);
        client.destroy();
        return emptySuccess();
    } catch (err) {
        return error(err.toString());
    }
}

function createClient(nodecg: NodeCG): (config: DiscordServiceConfig) => Promise<Result<DiscordServiceClient>> {
    return async (config) => {
        const client = new Client();
        return client.login(config.botToken).then(() => {
            nodecg.log.info("Successfully connected to discord.");
            return success({
                getRawClient() {
                    return client;
                },
            });
        });
    };
}

function stopClient(client: DiscordServiceClient): void {
    const rawClient = client.getRawClient();
    rawClient.destroy();
}
