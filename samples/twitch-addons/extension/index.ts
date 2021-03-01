import { NodeCG } from "nodecg/types/server";
import { TwitchAddonsClient } from "nodecg-io-twitch-addons";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Twitch-addons bundle started.");

    const twitch_addons = requireService<TwitchAddonsClient>(nodecg, "twitch-addons");

    twitch_addons?.onAvailable((_) => {
        nodecg.log.info("Twitch-addons service available.");
        // TODO: Implement
    });

    twitch_addons?.onUnavailable(() => {
        nodecg.log.info("Twitch-addons service unavailable.");
        // TODO: Implement
    });
};
