import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
import { serviceBundle, readSchema } from "nodecg-io-core/extension/serviceBundle";
import { Client } from "discord.js";

interface DiscordServiceConfig {
    botToken: string;
}

export interface DiscordServiceClient {
    getRawClient(): Client;
}

module.exports = (nodecg: NodeCG): ServiceProvider<DiscordServiceClient> | undefined => {
    const discord = new serviceBundle(nodecg, {
        schema: readSchema(nodecg, __dirname, "../discord-schema.json"),
        serviceType: "discord",
        validateConfig: validateConfig,
        createClient: createClient(nodecg),
        stopClient: stopClient,
    });

    return discord.register();
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
