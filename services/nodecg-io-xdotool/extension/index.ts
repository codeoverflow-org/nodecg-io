import NodeCG from "@nodecg/types";
import { Result, emptySuccess, success, error, ServiceBundle, Logger } from "nodecg-io-core";
import { Xdotool } from "./xdotool";

interface XdotoolServiceConfig {
    host: string;
    port: number;
}

export type XdotoolServiceClient = Xdotool;

module.exports = (nodecg: NodeCG.ServerAPI) => {
    new XdotoolServiceBundle(nodecg, "xdotool", __dirname, "../xdotool-schema.json").register();
};

class XdotoolServiceBundle extends ServiceBundle<XdotoolServiceConfig, XdotoolServiceClient> {
    async validateConfig(config: XdotoolServiceConfig, logger: Logger): Promise<Result<void>> {
        try {
            const xd = new Xdotool(logger, config.host, config.port);
            await xd.testConnection();
            return emptySuccess();
        } catch (err) {
            return error(String(err));
        }
    }

    async createClient(config: XdotoolServiceConfig, logger: Logger): Promise<Result<XdotoolServiceClient>> {
        try {
            const xd = new Xdotool(logger, config.host, config.port);
            return success(xd);
        } catch (err) {
            return error(String(err));
        }
    }

    stopClient(_: XdotoolServiceClient): void {
        // Nothing to do
    }
}
