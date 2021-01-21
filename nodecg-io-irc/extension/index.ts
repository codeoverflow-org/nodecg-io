import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, ServiceBundle, ServiceClient } from "nodecg-io-core";
import { Client as IRCClient } from "irc";

interface IRCServiceConfig {
    nick: string;
    host: string;
    port?: number;
    password?: string;
    reconnectTries?: number;
}

export interface IRCServiceClient extends ServiceClient<IRCClient> {
    sendMessage(target: string, message: string): void;
}

module.exports = (nodecg: NodeCG) => {
    new IRCService(nodecg, "irc", __dirname, "../irc-schema.json").register();
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
            IRC.disconnect("", () => res(undefined));
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
            getNativeClient() {
                return IRC;
            },
            sendMessage(target: string, message: string) {
                return sendMessage(IRC, target, message);
            },
        });
    }

    stopClient(client: IRCServiceClient): void {
        client.getNativeClient().disconnect("", () => {
            this.nodecg.log.info("Stopped IRC client successfully.");
        });
    }

    removeHandlers(client: IRCServiceClient): void {
        client.getNativeClient().removeAllListeners();
    }
}

function sendMessage(client: IRCClient, target: string, message: string): void {
    client.say(target, message);
}
