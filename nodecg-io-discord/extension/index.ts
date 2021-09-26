import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { Client as DiscordClient } from "discord.js";

interface DiscordServiceConfig {
    botToken: string;
}

export type DiscordServiceClient = DiscordClient;

module.exports = (nodecg: NodeCG) => {
    new DiscordService(nodecg, "discord", __dirname, "../discord-schema.json").register();
};

class DiscordService extends ServiceBundle<DiscordServiceConfig, DiscordServiceClient> {
    async validateConfig(config: DiscordServiceConfig): Promise<Result<void>> {
        const botToken = config.botToken;
        const client = new DiscordClient({ partials: ["CHANNEL", "MESSAGE", "REACTION", "GUILD_MEMBER", "USER"] });
        await client.login(botToken);
        client.destroy();
        return emptySuccess();
    }

    async createClient(config: DiscordServiceConfig): Promise<Result<DiscordServiceClient>> {
        const client = new DiscordClient({ partials: ["CHANNEL", "MESSAGE", "REACTION", "GUILD_MEMBER", "USER"] });
        await client.login(config.botToken);
        this.nodecg.log.info("Successfully connected to Discord.");
        return success(client);
    }

    stopClient(client: DiscordServiceClient): void {
        client.destroy();
    }

    removeHandlers(client: DiscordServiceClient): void {
        client.removeAllListeners();
    }
}
