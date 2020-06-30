import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
import { serviceBundle, readSchema } from "nodecg-io-core/extension/serviceBundle";
import { Rcon } from "rcon-client";

interface RconServiceConfig {
    host: string;
    port: number;
    password: string;
}

export interface RconServiceClient {
    getRawClient(): Rcon;
    sendMessage(message: string): Promise<string>;
}

module.exports = (nodecg: NodeCG): ServiceProvider<RconServiceClient> | undefined => {
    const rcon = new serviceBundle(nodecg, {
        schema: readSchema(nodecg, __dirname, "../rcon-schema.json"),
        serviceType: "rcon",
        validateConfig: validateConfig,
        createClient: createClient(nodecg),
        stopClient: stopClient,
    });

    return rcon.register();
};

async function validateConfig(config: RconServiceConfig): Promise<Result<void>> {
    try {
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
    } catch (err) {
        return error(err.toString());
    }
}

function sendMessage(client: Rcon, message: string): Promise<string> {
    return client.send(message);
}

function createClient(nodecg: NodeCG): (config: RconServiceConfig) => Promise<Result<RconServiceClient>> {
    return async (config) => {
        try {
            const rcon = new Rcon({
                host: config.host,
                port: config.port,
                password: config.password,
            });

            // We need one error handler or node will exit the process on an error.
            rcon.on("error", (_err) => {});

            await rcon.connect(); // This will throw an exception if there is an error.
            nodecg.log.info("Successfully connected to the rcon server.");

            return success({
                getRawClient() {
                    return rcon;
                },
                sendMessage(message: string) {
                    return sendMessage(rcon, message);
                },
            });
        } catch (err) {
            return error(err.toString());
        }
    };
}

function stopClient(client: RconServiceClient): void {
    client
        .getRawClient()
        .end()
        .then(() => {
            console.log("Stopped rcon client successfully.");
        });
}
