import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, Result, error } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { Xdotool } from "./xdotool";

interface XdotoolServiceConfig {
    host: string;
    port: number;
}

export interface XdotoolServiceClient {
    getRawClient(): Xdotool;
}

module.exports = (nodecg: NodeCG): ServiceProvider<XdotoolServiceClient> | undefined => {
    const service = new XdotoolServiceBundle(nodecg, "xdotool", __dirname, "xdotool-schema.json");
    return service.register();
};

class XdotoolServiceBundle extends ServiceBundle<XdotoolServiceConfig, XdotoolServiceClient> {
    async validateConfig(config: XdotoolServiceConfig): Promise<Result<void>> {
        try {
            const xd = new Xdotool(config.host, config.port);
            await xd.testConnection();
            return emptySuccess();
        } catch (err) {
            return error(err.toString());
        }
    }

    async createClient(config: XdotoolServiceConfig): Promise<Result<XdotoolServiceClient>> {
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
    }

    stopClient(_: XdotoolServiceClient): void {
        // Nothing to do
    }
}
