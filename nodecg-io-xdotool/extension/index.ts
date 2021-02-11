import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, error, ServiceBundle, ServiceClient } from "nodecg-io-core";
import { Xdotool } from "./xdotool";

interface XdotoolServiceConfig {
    host: string;
    port: number;
}

export type XdotoolServiceClient = ServiceClient<Xdotool>;

module.exports = (nodecg: NodeCG) => {
    new XdotoolServiceBundle(nodecg, "xdotool", __dirname, "../xdotool-schema.json").register();
};

class XdotoolServiceBundle extends ServiceBundle<XdotoolServiceConfig, XdotoolServiceClient> {
    async validateConfig(config: XdotoolServiceConfig): Promise<Result<void>> {
        try {
            const xd = new Xdotool(this.nodecg, config.host, config.port);
            await xd.testConnection();
            return emptySuccess();
        } catch (err) {
            return error(err.toString());
        }
    }

    async createClient(config: XdotoolServiceConfig): Promise<Result<XdotoolServiceClient>> {
        try {
            const xd = new Xdotool(this.nodecg, config.host, config.port);
            return success({
                getNativeClient() {
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
