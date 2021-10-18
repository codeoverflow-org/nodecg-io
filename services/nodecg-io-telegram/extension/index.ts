import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import TelegramBot = require("node-telegram-bot-api");

interface TelegramServiceConfig {
    token: string;
    polling?: boolean;
    webHook?: boolean;
    onlyFirstMatch?: boolean;
    baseApiUrl?: string;
    filepath?: boolean;
}

export type TelegramServiceClient = TelegramBot;

module.exports = (nodecg: NodeCG) => {
    new TelegramService(nodecg, "telegram", __dirname, "../telegram-schema.json").register();
};

class TelegramService extends ServiceBundle<TelegramServiceConfig, TelegramServiceClient> {
    async validateConfig(config: TelegramServiceConfig): Promise<Result<void>> {
        const bot = new TelegramBot(config.token);
        await bot.getMe();

        return emptySuccess();
    }

    async createClient(config: TelegramServiceConfig): Promise<Result<TelegramServiceClient>> {
        const options: TelegramBot.ConstructorOptions = {
            baseApiUrl: config.baseApiUrl,
            filepath: config.filepath,
            onlyFirstMatch: config.onlyFirstMatch,
            polling: config.polling,
            webHook: config.webHook,
        };

        const bot = new TelegramBot(config.token, options);

        this.nodecg.log.info("Successfully connected to the telegram server.");

        return success(bot);
    }

    stopClient(client: TelegramServiceClient): void {
        if (client.isPolling()) {
            client.stopPolling();
        }
        if (client.hasOpenWebHook()) {
            client.closeWebHook();
        }
    }

    removeHandlers(client: TelegramServiceClient): void {
        client.removeAllListeners();
        client.clearTextListeners();
        client.clearReplyListeners();
    }
}
