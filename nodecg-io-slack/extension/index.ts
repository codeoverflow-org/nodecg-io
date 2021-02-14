import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, error, ServiceBundle } from "nodecg-io-core";
import { WebClient } from "@slack/web-api";

interface SlackServiceConfig {
    token: string;
}

export type SlackServiceClient = WebClient;

module.exports = (nodecg: NodeCG) => {
    new SlackService(nodecg, "slack", __dirname, "../slack-schema.json").register();
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
            return success(client);
        } else {
            return error(res.error || "");
        }
    }

    stopClient(client: SlackServiceClient): void {
        // Not supported by the client, at least remove all listeners
        this.removeHandlers(client);
    }

    removeHandlers(client: SlackServiceClient): void {
        client.removeAllListeners();
    }
}
