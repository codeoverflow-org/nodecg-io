import { NodeCG } from "nodecg/types/server";
import { NodeCGIOCore } from "nodecg-io-core/extension";
import { Service, ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
import { getAHK, AHK } from "./AHK";

interface AHKServiceConfig {
    mode: "ahk" | "xdotool";
    host: string;
    port: number;
}

export interface AHKServiceClient {
    getRawClient(): AHK;
}

module.exports = (nodecg: NodeCG): ServiceProvider<AHKServiceClient> | undefined => {
    nodecg.log.info("AHK bundle started");
    const core = (nodecg.extensions["nodecg-io-core"] as unknown) as NodeCGIOCore | undefined;
    if (core === undefined) {
        nodecg.log.error("nodecg-io-core isn't loaded! AHK bundle won't function without it.");
        return undefined;
    }

    const service: Service<AHKServiceConfig, AHKServiceClient> = {
        schema: core.readSchema(__dirname, "../ahk-schema.json"),
        serviceType: "AHK",
        validateConfig: validateConfig,
        createClient: createClient(),
        stopClient: () => {},
    };

    return core.registerService(service);
};

async function validateConfig(config: AHKServiceConfig): Promise<Result<void>> {
    try {
        const ahk = getAHK(config.mode, config.host, config.port);
        await ahk.testConnection(); // Will throw an error if server doesn't exist.
        return emptySuccess();
    } catch (err) {
        return error(err.toString());
    }
}

function createClient(): (config: AHKServiceConfig) => Promise<Result<AHKServiceClient>> {
    return async (config) => {
        try {
            const ahk = getAHK(config.mode, config.host, config.port);
            return success({
                getRawClient() {
                    return ahk;
                },
            });
        } catch (err) {
            return error(err.toString());
        }
    };
}
