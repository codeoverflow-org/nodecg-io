import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, Result } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { Client as IRCClient } from "irc";

interface IRCServiceConfig {
    nick: string;
    host: string;
    port?: number;
    password?: string;
    reconnectTries?: number;
}

export interface IRCServiceClient {
    getRawClient(): IRCClient;
    sendMessage(target: string, message: string): void;
}

module.exports = (nodecg: NodeCG): ServiceProvider<IRCServiceClient> | undefined => {
    const ircService = new IRCService(nodecg, "irc", __dirname, "../irc-schema.json");
    return ircService.register();
};

class IRCService extends ServiceBundle<IRCServiceConfig, IRCServiceClient> {
    async validateConfig(config: IRCServiceConfig): Promise<Result<void>> {
        const IRC = new IRCClient(config.host, config.nick, { password: config.password });

        // We need one error handler or node will exit the process on an error.
        IRC.on("error", (_err) => {});

        await new Promise((res) => {
            IRC.connect(config.reconnectTries || 5, res);
        });
        await new Promise((res) => {
            IRC.disconnect("", res);
        });
        return emptySuccess();
    }

    async createClient(config: IRCServiceConfig): Promise<Result<IRCServiceClient>> {
        const IRC = new IRCClient(config.host, config.nick, { password: config.password });

        // We need one error handler or node will exit the process on an error.
        IRC.on("error", (_err) => {});

        await new Promise((res) => {
            IRC.connect(config.reconnectTries || 5, res);
        });
        this.nodecg.log.info("Successfully connected to the IRC server.");

        return success({
            getRawClient() {
                return IRC;
            },
            sendMessage(target: string, message: string) {
                return sendMessage(IRC, target, message);
            },
        });
    }

    stopClient(client: IRCServiceClient): void {
        client.getRawClient().disconnect("", () => {
            this.nodecg.log.info("Stopped IRC client successfully.");
        });
    }
}

function sendMessage(client: IRCClient, target: string, message: string): void {
    client.say(target, message);
}
