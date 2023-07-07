import NodeCG from "@nodecg/types";
import { TwitchAddonsClient } from "nodecg-io-twitch-addons";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG.ServerAPI) {
    nodecg.log.info("Twitch-addons bundle started.");

    const twitchAddons = requireService<TwitchAddonsClient>(nodecg, "twitch-addons");

    twitchAddons?.onAvailable(async (client) => {
        nodecg.log.info("Twitch-addons service available.");
        const emotes = await client.getEmoteCollection("#derniklaas", { includeGlobal: false });
        const emoteNames = client.getEmoteNames(emotes);
        const global = await client.getEmoteCollection("#derniklaas", { includeGlobal: true });
        const globalNames = client.getEmoteNames(global);
        const stv = await client.getEmoteCollection("#derniklaas", { includeGlobal: true, include7tv: true });
        const stvNames = client.getEmoteNames(stv);
        nodecg.log.info(`BTTV & FFZ emotes on the twitch channel #derniklaas (without global emotes): ${emoteNames}`);
        nodecg.log.info(`BTTV & FFZ emotes on the twitch channel #derniklaas (with global emotes): ${globalNames}`);
        nodecg.log.info(`BTTV, FFZ, & 7TV emotes on the twitch channel #derniklaas (with global emotes): ${stvNames}`);
    });

    twitchAddons?.onUnavailable(() => {
        nodecg.log.info("Twitch-addons service unavailable.");
    });
};
