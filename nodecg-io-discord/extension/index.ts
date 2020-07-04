import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, Result } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { Client } from "discord.js";

interface DiscordServiceConfig {
    botToken: string;
}

export interface DiscordServiceClient {
    getRawClient(): Client;
}

module.exports = (nodecg: NodeCG): ServiceProvider<DiscordServiceClient> | undefined => {
    const discordService = new DiscordService(nodecg, "discord", __dirname, "../discord-schema.json");
    return discordService.register();
};

class DiscordService extends ServiceBundle {
    async validateConfig(config: DiscordServiceConfig): Promise<Result<void>> {
        const botToken = config.botToken;
        const client = new Client();
        await client.login(botToken);
        client.destroy();
        return emptySuccess();
    }

    createClient(nodecg: NodeCG): (config: DiscordServiceConfig) => Promise<Result<DiscordServiceClient>> {
        return async (config) => {
            const client = new Client();
            await client.login(config.botToken);
            nodecg.log.info("Successfully connected to discord.");
            return success({
                getRawClient() {
                    return client;
                },
            });
        };
    }

    stopClient(client: DiscordServiceClient): void {
        const rawClient = client.getRawClient();
        rawClient.destroy();
    }
}
