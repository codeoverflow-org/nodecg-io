import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { TemplateClient } from "./templateClient";

export interface TemplateConfig {
    placeholder: string;
}

export { TemplateClient } from "./templateClient";

module.exports = (nodecg: NodeCG) => {
    new TemplateService(nodecg, "template", __dirname, "../schema.json").register();
};

class TemplateService extends ServiceBundle<TemplateConfig, TemplateClient> {
    async validateConfig(_: TemplateConfig): Promise<Result<void>> {
        // TODO: Implement
        return emptySuccess();
    }

    async createClient(config: TemplateConfig): Promise<Result<TemplateClient>> {
        // TODO: Implement
        const client = TemplateClient.createClient(config);
        this.nodecg.log.info("Successfully created template client.");
        return success(client);
    }

    stopClient(_: TemplateClient): void {
        // TODO: Implement
        this.nodecg.log.info("Successfully stopped template client.");
    }

    removeHandlers(_: TemplateClient): void {
        // TODO: Implement (optional)
    }
}
