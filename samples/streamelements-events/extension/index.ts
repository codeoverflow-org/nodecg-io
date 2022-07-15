import { NodeCG } from "nodecg-types/types/server";
import { StreamElementsReplicant, StreamElementsServiceClient } from "nodecg-io-streamelements";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for StreamElements started");

    const streamElements = requireService<StreamElementsServiceClient>(nodecg, "streamelements");
    const streamElementsReplicant = nodecg.Replicant<StreamElementsReplicant>("streamelements");

    streamElements?.onAvailable((client) => {
        nodecg.log.info("SE client has been updated, registering handlers now.");

        client.onCheer((data) => {
            nodecg.log.info(
                `${data.data.displayName} just cheered ${data.data.amount} bit(s). Message: ${data.data.message}`,
            );
        });

        client.onFollow((data) => {
            nodecg.log.info(`${data.data.displayName} just followed.`);
        });

        client.onSubscriber((data) => {
            if (data.data.tier) {
                const tier =
                    data.data.tier === "prime" ? "Twitch Prime" : "Tier " + Number.parseInt(data.data.tier) / 1000;
                nodecg.log.info(`${data.data.displayName} just subscribed for ${data.data.amount} months (${tier}).`);
            }
        });

        client.onGift((data) => {
            if (data.data.tier) {
                // We want to display the tier as 1, 2, 3
                // However StreamElements stores the sub tiers as 1000, 2000 and 3000.
                // So we divide the tier by 1000 to get the tier in our expected format.
                // We don't need to care about prime subs here because they cannot be gifted.
                const tier = (Number.parseInt(data.data.tier) / 1000).toString();
                if (data.data.sender) {
                    nodecg.log.info(
                        `${data.data.displayName} just got a tier ${tier} subscription from ${data.data.sender}! It's ${data.data.displayName}'s ${data.data.amount} month.`,
                    );
                } else {
                    nodecg.log.info(
                        `${data.data.displayName} just got a tier ${tier} subscription! It's ${data.data.displayName}'s ${data.data.amount} month.`,
                    );
                }
            }
        });

        client.onHost((data) => {
            nodecg.log.info(`${data.data.displayName} just hosted the stream for ${data.data.amount} viewer(s).`);
        });

        client.onRaid((data) => {
            nodecg.log.info(`${data.data.displayName} just raided the stream with ${data.data.amount} viewers.`);
        });

        client.onTip((data) => {
            if (data.data.currency) {
                nodecg.log.info(
                    `${data.data.username} just donated ${data.data.amount} ${data.data.currency}. Message. ${data.data.message}`,
                );
            }
        });

        client.onTest((data) => {
            nodecg.log.info(JSON.stringify(data));
        });

        client.setupReplicant(streamElementsReplicant);
    });

    streamElements?.onUnavailable(() => nodecg.log.info("SE client has been unset."));
};
