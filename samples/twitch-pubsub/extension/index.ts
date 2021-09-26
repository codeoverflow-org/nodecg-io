import { NodeCG } from "nodecg-types/types/server";
import { TwitchPubSubServiceClient } from "nodecg-io-twitch-pubsub";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for twitch-pubsub started");

    const pubsub = requireService<TwitchPubSubServiceClient>(nodecg, "twitch-pubsub");

    pubsub?.onAvailable((client) => {
        nodecg.log.info("PubSub client has been updated, adding handlers for messages.");
        client.onSubscription((message) => {
            nodecg.log.info(`${message.userDisplayName} just subscribed (${message.cumulativeMonths} months)`);
        });
        client.onBits((message) => {
            nodecg.log.info(`${message.userName} cheered ${message.bits} Bits`);
        });
        client.onBitsBadgeUnlock((message) => {
            nodecg.log.info(`${message.userName} just unlocked the ${message.badgeTier} Badge`);
        });
        client.onRedemption((message) => {
            nodecg.log.info(`${message.userDisplayName} redeemed ${message.rewardName} (${message.message})`);
        });
    });

    pubsub?.onUnavailable(() => nodecg.log.info("PubSub client has been unset."));
};
