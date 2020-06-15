import { NodeCG } from "nodecg/types/server";
import { NodeCGIOCore } from "nodecg-io-core/extension";
import { Service, ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
import { Rcon } from "rcon-client";
import { config } from 'process';

interface RconServiceConfig {
    host: string,
    port: number,
    password: string
}

export interface RconServiceClient {
    getRawClient(): Rcon
    sendMessage(message: string): Promise<string>
}

module.exports = (nodecg: NodeCG): ServiceProvider<RconServiceClient> | undefined => {
    nodecg.log.info("Rcon bundle started");
    const core: NodeCGIOCore | undefined = nodecg.extensions["nodecg-io-core"] as any;
    if (core === undefined) {
        nodecg.log.error("nodecg-io-core isn't loaded! Rcon bundle won't function without it.");
        return undefined;
    }

    const service: Service<RconServiceConfig, RconServiceClient> = {
        schema: core.readSchema(__dirname, "../rcon-schema.json"),
        serviceType: "rcon",
        validateConfig: validateConfig,
        createClient: createClient(nodecg),
        stopClient: stopClient
    };

    return core.registerService(service);
};

async function validateConfig(config: RconServiceConfig): Promise<Result<void>> {
    try{
        const rcon = await Rcon.connect({
            host: config.host, port: config.port, password: config.password
        }); // This will throw an error if it can't connect to a server
        rcon.end();
        return emptySuccess();
    }catch (err) {
        return error(err.toString());
    }
}

function sendMessage(client: Rcon, message: string): Promise<string> {
    return client.send(message);
}

function createClient(nodecg: NodeCG): (config: RconServiceConfig) => Promise<Result<RconServiceClient>> {
    return async (config) => {
        try{
            const rcon = await Rcon.connect({
                host: config.host, port: config.port, password: config.password
            });
            nodecg.log.info("Successfully connected to the rcon server.")

            return success({
                getRawClient() {
                    return rcon;
                },
                sendMessage(message: string) {
                    return sendMessage(rcon, message);
                }
            });
        } catch (err) {
            return error(err.toString());
        }
    }
}

function stopClient(client: RconServiceClient): void {
    client.getRawClient().end().then(r => {
        console.log("Stopped rcon client successfully.");
    });
}