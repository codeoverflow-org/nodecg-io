import { NodeCG } from "nodecg/types/server";
import { PubSubServiceClient } from "nodecg-io-twitch-pubsub/extension";
import { requireService } from "nodecg-io-core/extension/serviceClientWrapper";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for twitch-pubsub started");

    const pubsub = requireService<PubSubServiceClient>(nodecg, "twitch-pubsub");

    pubsub?.onAvailable((client) => {
        nodecg.log.info("PubSub client has been updated, adding handlers for messages.");
        client.onSubscription(async (message) => {
            const user = await message.getUser();
            if (user) console.log(`${user.displayName} just subscribed (${message.cumulativeMonths} months)`);
        });
        client.onBits(async (message) => {
            const user = await message.getUser();
            if (user) console.log(`${user.displayName} cheered ${message.bits} Bits`);
        });
        client.onBitsBadgeUnlock(async (message) => {
            const user = await message.getUser();
            if (user) console.log(`${user.displayName} just unlocked the ${message.badgeTier} Badge`);
        });
        client.onRedemption(async (message) => {
            const user = await message.getUser();
            if (user) console.log(`${user.displayName} redeemed ${message.rewardName} (${message.message})`);
        });
    });

    pubsub?.onUnavailable(() => nodecg.log.info("PubSub client has been unset."));
};
