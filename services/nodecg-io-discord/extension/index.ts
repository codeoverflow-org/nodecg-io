import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle, Logger } from "nodecg-io-core";
import { Client as DiscordClient, IntentsString } from "discord.js";

interface DiscordServiceConfig {
    botToken: string;
    intents?: IntentsString[];
}

export type DiscordServiceClient = DiscordClient;

module.exports = (nodecg: NodeCG) => {
    new DiscordService(nodecg, "discord", __dirname, "../discord-schema.json").register();
};

// All except GUILD_MEMBERS and GUILD_PRESENCES.
const defaultIntents: IntentsString[] = [
    "DIRECT_MESSAGES",
    "DIRECT_MESSAGE_REACTIONS",
    "DIRECT_MESSAGE_TYPING",
    "GUILDS",
    "GUILD_BANS",
    "GUILD_EMOJIS_AND_STICKERS",
    "GUILD_INTEGRATIONS",
    "GUILD_INVITES",
    "GUILD_MESSAGES",
    "GUILD_MESSAGE_REACTIONS",
    "GUILD_MESSAGE_TYPING",
    "GUILD_VOICE_STATES",
    "GUILD_WEBHOOKS",
];

class DiscordService extends ServiceBundle<DiscordServiceConfig, DiscordServiceClient> {
    async validateConfig(config: DiscordServiceConfig): Promise<Result<void>> {
        const botToken = config.botToken;
        const client = new DiscordClient({ intents: config.intents ?? defaultIntents });
        await client.login(botToken);
        client.destroy();
        return emptySuccess();
    }

    async createClient(config: DiscordServiceConfig, logger: Logger): Promise<Result<DiscordServiceClient>> {
        const client = new DiscordClient({ intents: defaultIntents ?? defaultIntents });
        await client.login(config.botToken);
        logger.info("Successfully connected to Discord.");
        return success(client);
    }

    stopClient(client: DiscordServiceClient): void {
        client.destroy();
    }

    removeHandlers(client: DiscordServiceClient): void {
        client.removeAllListeners();
    }
}
