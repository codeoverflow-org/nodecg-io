import { NodeCG } from "nodecg/types/server";
import { emptySuccess, Result, success } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { Client } from "discord.js";

interface DiscordServiceConfig {
    botToken: string;
}

export interface DiscordServiceClient {
    getRawClient(): Client;
}

module.exports = (nodecg: NodeCG) => {
    new DiscordService(nodecg, "discord", __dirname, "../discord-schema.json").register();
};

class DiscordService extends ServiceBundle<DiscordServiceConfig, DiscordServiceClient> {
    async validateConfig(config: DiscordServiceConfig): Promise<Result<void>> {
        const botToken = config.botToken;
        const client = new Client();
        await client.login(botToken);
        client.destroy();
        return emptySuccess();
    }

    async createClient(config: DiscordServiceConfig): Promise<Result<DiscordServiceClient>> {
        const client = new Client();
        await client.login(config.botToken);
        this.nodecg.log.info("Successfully connected to discord.");
        return success({
            getRawClient() {
                return client;
            },
        });
    }

    stopClient(client: DiscordServiceClient): void {
        const rawClient = client.getRawClient();
        rawClient.destroy();
    }
}
