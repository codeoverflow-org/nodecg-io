import NodeCG from "@nodecg/types";
import { Result, emptySuccess, success, ServiceBundle, Logger } from "nodecg-io-core";
import { Client as DiscordClient, GatewayIntentBits } from "discord.js";

interface DiscordServiceConfig {
    botToken: string;
    intents?: GatewayIntentBits[];
}

export type DiscordServiceClient = DiscordClient;

module.exports = (nodecg: NodeCG.ServerAPI) => {
    new DiscordService(nodecg, "discord", __dirname, "../discord-schema.json").register();
};

const defaultIntents: GatewayIntentBits[] = [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildWebhooks,
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
