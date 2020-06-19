import { NodeCG } from "nodecg/types/server";
import { NodeCGIOCore } from "nodecg-io-core/extension";
import { Service, ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
import * as WebSocket from "ws";

interface WSClientServiceConfig {
    host: string,
    port: number
}

export interface WSClientServiceClient {
    getRawClient(): WebSocket
}

module.exports = (nodecg: NodeCG): ServiceProvider<WSClientServiceClient> | undefined => {
    nodecg.log.info("Websocket client bundle started");
    const core: NodeCGIOCore | undefined = nodecg.extensions["nodecg-io-core"] as any;
    if (core === undefined) {
        nodecg.log.error("nodecg-io-core isn't loaded! Websocket client bundle won't function without it.");
        return undefined;
    }

    const service: Service<WSClientServiceConfig, WSClientServiceClient> = {
        schema: core.readSchema(__dirname, "../ws-schema.json"),
        serviceType: "websocket-client",
        validateConfig: validateConfig,
        createClient: createClient(nodecg),
        stopClient: stopClient
    };

    return core.registerService(service);
};

async function validateConfig(config: WSClientServiceConfig): Promise<Result<void>> {
    try{
        const client = new WebSocket(`ws://${config.host}:${config.port}`); // Will crash nodecg if the websocket couldn't connect to a server.
        let open = false;
        client.on('open', () => {
            open = true;
        });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Ugly, but I don't really know a better way
        if(open) {
            client.close();
            return emptySuccess();
        }
        return error("Could not open Connection.");
    } catch (err) {
        return error(err.toString());
    }
}

function createClient(nodecg: NodeCG): (config: WSClientServiceConfig) => Promise<Result<WSClientServiceClient>> {
    return async (config) => {
        try{
            const client = new WebSocket(`ws://${config.host}:${config.port}`);
            return success({
                getRawClient() {
                    return client;
                }
            });
        } catch (err) {
            return error(err.toString());
        }
    }
}

function stopClient(client: WSClientServiceClient): void {
    client.getRawClient().close();
}