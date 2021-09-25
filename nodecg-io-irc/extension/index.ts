import { NodeCG } from "nodecg-types/types/server";
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
        super(config.host, config.nick, {
            password: config.password,
            autoConnect: false,
            retryCount: config.reconnectTries ?? 3,
            retryDelay: 500,
        });
    }

    sendMessage(target: string, message: string): void {
        this.say(target, message);
    }
}

module.exports = (nodecg: NodeCG) => {
    new IRCService(nodecg, "irc", __dirname, "../irc-schema.json").register();
};

class IRCService extends ServiceBundle<IRCServiceConfig, IRCServiceClient> {
    async validateConfig(_config: IRCServiceConfig): Promise<Result<void>> {
        // no checks are currently done here. Server and password are checked in createClient()
        // We could check whether the port is valid and the host/ip is valid here in the future.
        return emptySuccess();
    }

    async createClient(config: IRCServiceConfig): Promise<Result<IRCServiceClient>> {
        const irc = new IRCServiceClient(config);

        this.nodecg.log.info("Connecting to IRC...");
        await this.connect(irc);
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

    private connect(client: IRCServiceClient): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // We need one error handler or node will exit the process on an error.
            client.on("error", (err) => reject(err));
            client.on("abort", () => {
                reject("Couldn't connect to IRC server! Maximum retry count reached.");
            });

            client.connect(0, () => resolve(undefined));
        });
    }
}
