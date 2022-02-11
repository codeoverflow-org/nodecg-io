import { Logger } from "nodecg-io-core";
import { TemplateConfig } from "./index";

export class TemplateClient {
    constructor(_: TemplateConfig, __: Logger) {
        // TODO: Implement
    }

    static createClient(config: TemplateConfig, logger: Logger): TemplateClient {
        // TODO: Implement
        return new TemplateClient(config, logger);
    }
}
