import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { Client as IRCClient } from "irc";

interface IRCServiceConfig {
    nick: string;
    host: string;
    port?: number;
    password?: string;
    reconnectTries?: number;
}

export class IRCServiceClient extends IRCClient {
    constructor(config: IRCServiceConfig) {
        super(config.host, config.nick, { password: config.password });
    }

    sendMessage(target: string, message: string): void {
        this.say(target, message);
    }
}

module.exports = (nodecg: NodeCG) => {
    new IRCService(nodecg, "irc", __dirname, "../irc-schema.json").register();
};

class IRCService extends ServiceBundle<IRCServiceConfig, IRCServiceClient> {
    async validateConfig(config: IRCServiceConfig): Promise<Result<void>> {
        const irc = new IRCServiceClient(config);

        // We need one error handler or node will exit the process on an error.
        irc.on("error", (_err) => {});

        await new Promise((res) => {
            irc.connect(config.reconnectTries || 5, res);
        });
        await new Promise((res) => {
            irc.disconnect("", () => res(undefined));
        });
        return emptySuccess();
    }

    async createClient(config: IRCServiceConfig): Promise<Result<IRCServiceClient>> {
        const irc = new IRCServiceClient(config);

        // We need one error handler or node will exit the process on an error.
        irc.on("error", (_err) => {});

        await new Promise((res) => {
            irc.connect(config.reconnectTries || 5, res);
        });
        this.nodecg.log.info("Successfully connected to the IRC server.");

        return success(irc);
    }

    stopClient(client: IRCServiceClient): void {
        client.disconnect("", () => {
            this.nodecg.log.info("Stopped IRC client successfully.");
        });
    }

    removeHandlers(client: IRCServiceClient): void {
        client.removeAllListeners();
    }
}
