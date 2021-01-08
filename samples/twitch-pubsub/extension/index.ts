import { NodeCG } from "nodecg/types/server";
import { PubSubServiceClient } from "nodecg-io-twitch-pubsub";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for twitch-pubsub started");

    const pubsub = requireService<PubSubServiceClient>(nodecg, "twitch-pubsub");

    pubsub?.onAvailable((client) => {
        nodecg.log.info("PubSub client has been updated, adding handlers for messages.");
        client.onSubscription((message) => {
            console.log(`${message.userDisplayName} just subscribed (${message.cumulativeMonths} months)`);
        });
        client.onBits((message) => {
            console.log(`${message.userName} cheered ${message.bits} Bits`);
        });
        client.onBitsBadgeUnlock((message) => {
            console.log(`${message.userName} just unlocked the ${message.badgeTier} Badge`);
        });
        client.onRedemption((message) => {
            console.log(`${message.userDisplayName} redeemed ${message.rewardName} (${message.message})`);
        });
    });

    pubsub?.onUnavailable(() => nodecg.log.info("PubSub client has been unset."));
};
