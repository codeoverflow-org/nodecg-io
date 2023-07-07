import NodeCG from "@nodecg/types";
import { StreamElementsReplicant, StreamElementsServiceClient } from "nodecg-io-streamelements";
import { StreamElementsEvent, StreamElementsTestEvent } from "nodecg-io-streamelements/extension/StreamElementsEvent";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG.ServerAPI) {
    nodecg.log.info("Sample bundle for StreamElements started");

    const streamElements = requireService<StreamElementsServiceClient>(nodecg, "streamelements");
    const streamElementsReplicant = nodecg.Replicant<StreamElementsReplicant>("streamelements");

    streamElements?.onAvailable((client) => {
        nodecg.log.info("SE client has been updated, registering handlers now.");

        client.onCheer((data) => {
            nodecg.log.info(`${getName(data)} just cheered ${data.data.amount} bit(s). Message: ${data.data.message}`);
        });

        client.onTestCheer((data) => {
            nodecg.log.info(
                `${getName(data)} just cheered ${data.event.amount} bit(s). Message: ${data.event.message}`,
            );
        });

        client.onFollow((data) => {
            nodecg.log.info(`${getName(data)} just followed.`);
        });

        client.onTestFollow((data) => {
            nodecg.log.info(`${getName(data)} just followed.`);
        });

        client.onSubscriber((data) => {
            nodecg.log.info(
                `${getName(data)} just subscribed for ${data.data.amount} months (${formatSubTier(data.data.tier)}).`,
            );
        });

        client.onTestSubscriber((data) => {
            nodecg.log.info(
                `${getName(data)} just subscribed for ${data.event.amount} months (${formatSubTier(data.event.tier)}).`,
            );
        });

        client.onSubscriberBomb((data) => {
            nodecg.log.info(`${data.gifterUsername} just gifted ${data.subscribers.length} subs.`);
        });

        client.onTestSubscriberBomb((data) => {
            nodecg.log.info(`${data.gifterUsername} just gifted ${data.subscribers.length} subs.`);
        });

        client.onGift((data) => {
            nodecg.log.info(
                `${getName(data)} just got a tier ${formatSubTier(data.data.tier)} subscription from ${
                    data.data.sender ?? "anonymous"
                }! It's ${data.data.displayName ?? data.data.username}'s ${data.data.amount} month.`,
            );
        });

        client.onTestGift((data) => {
            nodecg.log.info(
                `${getName(data)} just got a tier ${formatSubTier(data.event.tier)} subscription from ${
                    data.event.sender ?? "anonymous"
                }! It's ${data.event.displayName}'s ${data.event.amount} month.`,
            );
        });

        client.onHost((data) => {
            nodecg.log.info(`${getName(data)} just hosted the stream for ${data.data.amount} viewer(s).`);
        });

        client.onTestHost((data) => {
            nodecg.log.info(`${getName(data)} just hosted the stream for ${data.event.amount} viewer(s).`);
        });

        client.onRaid((data) => {
            nodecg.log.info(`${getName(data)} just raided the stream with ${data.data.amount} viewers.`);
        });

        client.onTestRaid((data) => {
            nodecg.log.info(`${getName(data)} just raided the stream with ${data.event.amount} viewers.`);
        });

        client.onTip((data) => {
            if (data.data.currency) {
                nodecg.log.info(
                    `${getName(data)} just donated ${data.data.amount} ${data.data.currency}. Message. ${
                        data.data.message
                    }`,
                );
            }
        });

        client.onTestTip((data) => {
            nodecg.log.info(
                `${getName(data)} just donated ${data.event.amount} ${data.event.currency}. Message. ${
                    data.event.message
                }`,
            );
        });

        client.onTest((data) => {
            nodecg.log.info(JSON.stringify(data));
        });

        client.setupReplicant(streamElementsReplicant);
    });

    streamElements?.onUnavailable(() => nodecg.log.info("SE client has been unset."));
};

/**
 * Gets the name of the user from the event.
 * Defaults to use the displayName that is sent by StreamElements.
 * The displayName contains capitalization and special characters.
 * If the displayName is not available, the normal username of the relevant platform is used.
 * Supports real and test events.
 */
function getName(event: StreamElementsEvent | StreamElementsTestEvent): string {
    const eventData = "data" in event ? event.data : event.event;

    if ("displayName" in eventData && typeof eventData.displayName === "string") {
        return eventData.displayName;
    } else if ("name" in eventData && typeof eventData.name === "string") {
        return eventData.name;
    } else if ("username" in eventData && typeof eventData.username === "string") {
        return eventData.username;
    } else {
        return "unknown";
    }
}

function formatSubTier(tier: "1000" | "2000" | "3000" | "prime"): string {
    if (tier === "prime") return "Twitch Prime";

    // We want to display the tier as 1, 2, 3
    // However StreamElements stores the sub tiers as 1000, 2000 and 3000.
    // So we divide the tier by 1000 to get the tier in our expected format.
    return "Tier " + (Number.parseInt(tier) / 1000).toString();
}
