import { NodeCG } from "nodecg/types/server";
import { ServiceProvider, ServiceClient } from "nodecg-io-core/extension/types";
import { emptySuccess, success, Result } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { Client as DiscordClient } from "discord.js";

interface DiscordServiceConfig {
    botToken: string;
}

export interface DiscordServiceClient extends ServiceClient<DiscordClient> {}

module.exports = (nodecg: NodeCG): ServiceProvider<DiscordServiceClient> | undefined => {
    const discordService = new DiscordService(nodecg, "discord", __dirname, "../discord-schema.json");
    return discordService.register();
};

class DiscordService extends ServiceBundle<DiscordServiceConfig, DiscordServiceClient> {
    async validateConfig(config: DiscordServiceConfig): Promise<Result<void>> {
        const botToken = config.botToken;
        const client = new DiscordClient();
        await client.login(botToken);
        client.destroy();
        return emptySuccess();
    }

    async createClient(config: DiscordServiceConfig): Promise<Result<DiscordServiceClient>> {
        const client = new DiscordClient();
        await client.login(config.botToken);
        this.nodecg.log.info("Successfully connected to discord.");
        return success({
            getNativeClient() {
                return client;
            },
        });
    }

    stopClient(client: DiscordServiceClient): void {
        const rawClient = client.getNativeClient();
        rawClient.destroy();
    }
}
