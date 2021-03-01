import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { TwitchAddonsClient } from "./twitchAddonsClient";
import fetch from "node-fetch";

export interface TwitchAddonsConfig {
    oauthKey: string;
}

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

class TwitchAddonsService extends ServiceBundle<TwitchAddonsConfig, TwitchAddonsClient> {
    async validateConfig(config: TwitchAddonsConfig): Promise<Result<void>> {
        await TwitchAddonsService.getClientId(TwitchAddonsService.normalizeToken(config.oauthKey));
        return emptySuccess();
    }

    async createClient(config: TwitchAddonsConfig): Promise<Result<TwitchAddonsClient>> {
        const normalizedToken = TwitchAddonsService.normalizeToken(config.oauthKey);
        const client = TwitchAddonsClient.createClient(
            await TwitchAddonsService.getClientId(normalizedToken),
            normalizedToken,
        );
        this.nodecg.log.info("Successfully created twitch-addons client.");
        return success(client);
    }

    stopClient(_: TwitchAddonsClient): void {
        this.nodecg.log.info("Successfully stopped twitch-addons client.");
    }

    private static normalizeToken(token: string): string {
        if (token.toLowerCase().startsWith("oauth:")) {
            return token.substr(6);
        } else {
            return token;
        }
    }

    private static async getClientId(token: string): Promise<string> {
        const response = await (
            await fetch(`https://id.twitch.tv/oauth2/validate`, {
                headers: {
                    Authorization: "OAuth " + token,
                },
            })
        ).json();
        if (response.client_id == undefined) {
            throw new Error(
                "Failed to get client id for twitch token in nodecg-io-twitch-addons. Probably invalid token.",
            );
        }
        return response.client_id;
    }
}
