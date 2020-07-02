import { NodeCG } from "nodecg/types/server";
import { NodeCGIOCore } from "nodecg-io-core/extension";
import { Service, ServiceProvider } from "nodecg-io-core/extension/types";
import { Result, emptySuccess, error, success } from "nodecg-io-core/extension/utils/result";

interface PhilipsHueServiceConfig {}

export interface PhilipsHueServiceClient {}

export function PhilipsHue(nodecg: NodeCG): ServiceProvider<PhilipsHueServiceClient> | undefined {
    nodecg.log.info("Philips Hue bundle started.");
    const core = (nodecg.extensions["nodecg-io-core"] as unknown) as NodeCGIOCore;
    if (!core) {
        nodecg.log.error("nodecg-io-core isn't loaded! Philips Hue bundle won't function without it.");
        return undefined;
    }

    const service: Service<PhilipsHueServiceConfig, PhilipsHueServiceClient> = {
        schema: core.readSchema(__dirname, "../philipshue-schema.json"),
        serviceType: "philipshue",
        validateConfig,
        createClient: createClient(nodecg),
        stopClient,
    };

    return core.registerService(service);
}

async function validateConfig(config: PhilipsHueServiceConfig): Promise<Result<void>> {
    if (!config) {
        return error("No config found!");
    } else {
        return emptySuccess();
    }
}

function createClient(nodecg: NodeCG): (config: PhilipsHueServiceConfig) => Promise<Result<PhilipsHueServiceClient>> {
    return async (config) => {
        // TODO: connect to bridge by either using discover or using the IP address
        // TODO: make commands and stuff

        return success({});
    };
}

function stopClient(_client: PhilipsHueServiceClient) {
    // Not supported from the client
}
