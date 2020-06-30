import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
import { serviceBundle, readSchema } from "nodecg-io-core/extension/serviceBundle";
import { AHK } from "./AHK";

interface AHKServiceConfig {
    host: string;
    port: number;
}

export interface AHKServiceClient {
    getRawClient(): AHK;
}

module.exports = (nodecg: NodeCG): ServiceProvider<AHKServiceClient> | undefined => {
    const ahk = new serviceBundle(nodecg, {
        schema: readSchema(nodecg, __dirname, "../ahk-schema.json"),
        serviceType: "AHK",
        validateConfig: validateConfig,
        createClient: createClient(),
        stopClient: () => {},
    });

    return ahk.register();
};

async function validateConfig(config: AHKServiceConfig): Promise<Result<void>> {
    try {
        const ahk = new AHK(config.host, config.port);
        await ahk.testConnection(); // Will throw an error if server doesn't exist.
        return emptySuccess();
    } catch (err) {
        return error(err.toString());
    }
}

function createClient(): (config: AHKServiceConfig) => Promise<Result<AHKServiceClient>> {
    return async (config) => {
        try {
            const ahk = new AHK(config.host, config.port);
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
