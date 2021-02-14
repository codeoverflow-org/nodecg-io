import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { Rcon } from "rcon-client";

interface RconServiceConfig {
    host: string;
    port: number;
    password: string;
}

export type RconServiceClient = Rcon;

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
        this.nodecg.log.info("Successfully connected to the RCON server.");

        return success(rcon);
    }

    stopClient(client: RconServiceClient): void {
        client.end().then(() => {
            this.nodecg.log.info("Successfully stopped RCON client.");
        });
    }
}
