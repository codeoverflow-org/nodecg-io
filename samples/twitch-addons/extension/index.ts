import { NodeCG } from "nodecg/types/server";
import { TwitchAddonsClient } from "nodecg-io-twitch-addons";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Twitch-addons bundle started.");

    const twitchAddons = requireService<TwitchAddonsClient>(nodecg, "twitch-addons");

    twitchAddons?.onAvailable(async (client) => {
        nodecg.log.info("Twitch-addons service available.");
        const emotes = await client.getEmoteCollection("#derniklaas", false);
        const emoteNames = client.getEmoteNames(emotes);
        const global = await client.getEmoteCollection("#derniklaas", true);
        const globalNames = client.getEmoteNames(global);
        nodecg.log.info(`BTTV & FFZ emotes on the twitch channel #derniklaas (without global emotes): ${emoteNames}`);
        nodecg.log.info(`BTTV & FFZ emotes on the twitch channel #derniklaas (with global emotes): ${globalNames}`);
    });

    twitchAddons?.onUnavailable(() => {
        nodecg.log.info("Twitch-addons service unavailable.");
    });
};
