import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { TwitchAddonsClient } from "./twitchAddonsClient";

export interface TwitchAddonsConfig {
    placeholder: string;
}

export { TwitchAddonsClient } from "./twitchAddonsClient";

module.exports = (nodecg: NodeCG) => {
    new TwitchAddonsService(nodecg, "twitch-addons", __dirname, "../schema.json").register();
};

class TwitchAddonsService extends ServiceBundle<TwitchAddonsConfig, TwitchAddonsClient> {
    async validateConfig(_: TwitchAddonsConfig): Promise<Result<void>> {
        // TODO: Implement
        return emptySuccess();
    }

    async createClient(config: TwitchAddonsConfig): Promise<Result<TwitchAddonsClient>> {
        // TODO: Implement
        const client = TwitchAddonsClient.createClient(config);
        this.nodecg.log.info("Successfully created twitch-addons client.");
        return success(client);
    }

    stopClient(_: TwitchAddonsClient): void {
        // TODO: Implement
        this.nodecg.log.info("Successfully stopped twitch-addons client.");
    }

    removeHandlers(_: TwitchAddonsClient): void {
        // TODO: Implement (optional)
    }
}
