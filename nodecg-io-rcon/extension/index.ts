import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, ServiceBundle, ServiceClient } from "nodecg-io-core";
import { Rcon } from "rcon-client";

interface RconServiceConfig {
    host: string;
    port: number;
    password: string;
}

export interface RconServiceClient extends ServiceClient<Rcon> {
    sendMessage(message: string): Promise<string>;
}

module.exports = (nodecg: NodeCG) => {
    new RconService(nodecg, "rcon", __dirname, "../rcon-schema.json").register();
};

class RconService extends ServiceBundle<RconServiceConfig, RconServiceClient> {
    async validateConfig(config: RconServiceConfig): Promise<Result<void>> {
        const rcon = new Rcon({
            host: config.host,
            port: config.port,
            password: config.password,
        });

        // We need one error handler or node will exit the process on an error.
        rcon.on("error", (_err) => {});

        await rcon.connect(); // This will throw an exception if there is an error.
        rcon.end();
        return emptySuccess();
    }

    async createClient(config: RconServiceConfig): Promise<Result<RconServiceClient>> {
        const rcon = new Rcon({
            host: config.host,
            port: config.port,
            password: config.password,
        });

        // We need one error handler or node will exit the process on an error.
        rcon.on("error", (_err) => {});

        await rcon.connect(); // This will throw an exception if there is an error.
        this.nodecg.log.info("Successfully connected to the rcon server.");

        return success({
            getNativeClient() {
                return rcon;
            },
            sendMessage(message: string) {
                return sendMessage(rcon, message);
            },
        });
    }

    stopClient(client: RconServiceClient): void {
        client
            .getNativeClient()
            .end()
            .then(() => {
                this.nodecg.log.info("Stopped rcon client successfully.");
            });
    }
}

function sendMessage(client: Rcon, message: string): Promise<string> {
    return client.send(message);
}
