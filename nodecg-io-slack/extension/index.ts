import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { WebClient } from "@slack/web-api";

interface SlackServiceConfig {
    token: string;
}

export interface SlackServiceClient {
    getRawClient(): WebClient;
}

module.exports = (nodecg: NodeCG): ServiceProvider<SlackServiceClient> | undefined => {
    const slackService = new SlackService(nodecg, "slack", __dirname, "../slack-schema.json");
    return slackService.register();
};

class SlackService extends ServiceBundle<SlackServiceConfig, SlackServiceClient> {
    async validateConfig(config: SlackServiceConfig): Promise<Result<void>> {
        const client = new WebClient(config.token);

        const res = await client.auth.test();
        if (res.ok) {
            return emptySuccess();
        } else {
            return error(res.error || "");
        }
    }

    async createClient(config: SlackServiceConfig): Promise<Result<SlackServiceClient>> {
        const client = new WebClient(config.token);
        this.nodecg.log.info("Successfully created Web Client for Slack WebAPI.");
        const res = await client.auth.test();
        if (res.ok) {
            return success({
                getRawClient() {
                    return client;
                },
            });
        } else {
            return error(res.error || "");
        }
    }

    stopClient(client: SlackServiceClient): void {
        client.getRawClient(); //Only that lint has no warnings
    }
}
