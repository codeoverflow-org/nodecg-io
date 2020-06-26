import { NodeCG } from "nodecg/types/server";
import { NodeCGIOCore } from "nodecg-io-core/extension";
import { Service, ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
import * as WebSocket from "ws";

interface WSServerServiceConfig {
    port: number
}

export interface WSServerServiceClient {
    getRawClient(): WebSocket.Server
}

module.exports = (nodecg: NodeCG): ServiceProvider<WSServerServiceClient> | undefined => {
    nodecg.log.info("Websocket server bundle started");
    const core: NodeCGIOCore | undefined = nodecg.extensions["nodecg-io-core"] as any;
    if (core === undefined) {
        nodecg.log.error("nodecg-io-core isn't loaded! Websocket server bundle won't function without it.");
        return undefined;
    }

    const service: Service<WSServerServiceConfig, WSServerServiceClient> = {
        schema: core.readSchema(__dirname, "../ws-schema.json"),
        serviceType: "websocket-server",
        validateConfig: validateConfig,
        createClient: createClient(nodecg),
        stopClient: stopClient
    };

    return core.registerService(service);
};

async function validateConfig(config: WSServerServiceConfig): Promise<Result<void>> {
    try{
        const client = new WebSocket.Server({port: config.port}); // Will crash nodecg if port is already in use
        client.close();
        return emptySuccess();
    } catch (err) {
        return error(err.toString());
    }
}

function createClient(nodecg: NodeCG): (config: WSServerServiceConfig) => Promise<Result<WSServerServiceClient>> {
    return async (config) => {
        try{
            const client = new WebSocket.Server({port: config.port});
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

function stopClient(client: WSServerServiceClient): void {
    client.getRawClient().close();
}