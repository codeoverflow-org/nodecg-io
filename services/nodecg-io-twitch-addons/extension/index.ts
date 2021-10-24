import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { getTokenInfo, TwitchServiceConfig } from "nodecg-io-twitch-auth";
import { TwitchAddonsClient } from "./twitchAddonsClient";

export {
    TwitchAddonsClient,
    BetterTTVChannel,
    BetterTTVEmote,
    BetterTTVChannelEmote,
    BetterTTVSharedEmote,
    BetterTTVUser,
    FFZUrl,
    FFZChannel,
    FFZRoom,
    FFZEmoteSet,
    FFZEmote,
    FFZUser,
    FFZGlobalEmotes,
    EmoteCollection,
    EmoteResolution,
} from "./twitchAddonsClient";

module.exports = (nodecg: NodeCG) => {
    new TwitchAddonsService(nodecg, "twitch-addons", __dirname, "../schema.json").register();
};

class TwitchAddonsService extends ServiceBundle<TwitchServiceConfig, TwitchAddonsClient> {
    async validateConfig(config: TwitchServiceConfig): Promise<Result<void>> {
        await getTokenInfo(config); // throws an error if the token is invalid.
        return emptySuccess();
    }

    async createClient(config: TwitchServiceConfig): Promise<Result<TwitchAddonsClient>> {
        const client = await TwitchAddonsClient.createClient(config);
        this.nodecg.log.info("Successfully created twitch-addons client.");
        return success(client);
    }

    stopClient(_: TwitchAddonsClient): void {
        this.nodecg.log.info("Successfully stopped twitch-addons client.");
    }
}
