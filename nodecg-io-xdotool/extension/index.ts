import { NodeCG } from "nodecg/types/server";
import { NodeCGIOCore } from "nodecg-io-core/extension";
import { Service, ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
import { Xdotool } from "./xdotool";

interface XdotoolServiceConfig {
    host: string;
    port: number;
}

export interface XdotoolServiceClient {
    getRawClient(): Xdotool;
}

module.exports = (nodecg: NodeCG): ServiceProvider<XdotoolServiceClient> | undefined => {
    nodecg.log.info("Xdotool bundle started");
    const core = (nodecg.extensions["nodecg-io-core"] as unknown) as NodeCGIOCore | undefined;
    if (core === undefined) {
        nodecg.log.error("nodecg-io-core isn't loaded! Xdotool bundle won't function without it.");
        return undefined;
    }

    const service: Service<XdotoolServiceConfig, XdotoolServiceClient> = {
        schema: core.readSchema(__dirname, "../xdotool-schema.json"),
        serviceType: "xdotool",
        validateConfig: validateConfig,
        createClient: createClient(),
        stopClient: () => {},
    };

    return core.registerService(service);
};

async function validateConfig(config: XdotoolServiceConfig): Promise<Result<void>> {
    try {
        const xd = new Xdotool(config.host, config.port);
        await xd.testConnection();
        return emptySuccess();
    } catch (err) {
        return error(err.toString());
    }
}

function createClient(): (config: XdotoolServiceConfig) => Promise<Result<XdotoolServiceClient>> {
    return async (config) => {
        try {
            const xd = new Xdotool(config.host, config.port);
            return success({
                getRawClient() {
                    return xd;
                },
            });
        } catch (err) {
            return error(err.toString());
        }
    };
}
