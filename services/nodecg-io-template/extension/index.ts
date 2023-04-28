import NodeCG from "@nodecg/types";
import { Result, emptySuccess, success, ServiceBundle, Logger } from "nodecg-io-core";
import { TemplateClient } from "./templateClient";

export interface TemplateConfig {
    placeholder: string;
}

export { TemplateClient } from "./templateClient";

module.exports = (nodecg: NodeCG.ServerAPI) => {
    new TemplateService(nodecg, "template", __dirname, "../schema.json").register();
};

class TemplateService extends ServiceBundle<TemplateConfig, TemplateClient> {
    async validateConfig(_: TemplateConfig): Promise<Result<void>> {
        // TODO: Implement
        return emptySuccess();
    }

    async createClient(config: TemplateConfig, logger: Logger): Promise<Result<TemplateClient>> {
        // TODO: Implement
        const client = TemplateClient.createClient(config, logger);
        logger.info("Successfully created template client.");
        return success(client);
    }

    stopClient(_: TemplateClient, logger: Logger): void {
        // TODO: Implement
        logger.info("Successfully stopped template client.");
    }

    removeHandlers(_: TemplateClient): void {
        // TODO: Implement (optional)
    }
}
