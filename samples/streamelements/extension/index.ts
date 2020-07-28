import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { StreamElementsServiceClient } from "nodecg-io-streamelements/extension";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for StreamElements started");

    // This explicit cast determines the client type in the requireService call
    const streamElements = (nodecg.extensions["nodecg-io-streamelements"] as unknown) as
        | ServiceProvider<StreamElementsServiceClient>
        | undefined;

    streamElements?.requireService(
        "streamelements",
        (client) => {
            nodecg.log.info("SE client has been set, registering handlers now.");

            client.onCheer((data) => {
                nodecg.log.info(
                    data.data.displayName +
                        " just cheered " +
                        data.data.amount +
                        " bit(s). Message: " +
                        data.data.message,
                );
            });

            client.onFollow((data) => {
                nodecg.log.info(data.data.displayName + " just followed!");
            });

            client.onSubscriber((data) => {
                if (data.data.tier) {
                    const tier =
                        data.data.tier === "prime" ? "Twitch Prime" : "Tier " + Number.parseInt(data.data.tier) / 1000;
                    nodecg.log.info(
                        data.data.displayName + " just subscribed for " + data.data.amount + " months (" + tier + ")!",
                    );
                }
            });

            client.onGift((data) => {
                if (data.data.tier) {
                    const tier = (Number.parseInt(data.data.tier) / 1000).toString();
                    if (data.data.sender) {
                        nodecg.log.info(
                            data.data.displayName +
                                " just got a tier " +
                                tier +
                                " subscribtion from" +
                                data.data.sender +
                                "! It's " +
                                data.data.displayName +
                                "'s " +
                                data.data.amount +
                                " month.",
                        );
                    } else {
                        nodecg.log.info(
                            data.data.displayName +
                                " just got a tier " +
                                tier +
                                " gift subscribtion! It's " +
                                data.data.displayName +
                                "'s " +
                                data.data.amount +
                                " month.",
                        );
                    }
                }
            });

            client.onHost((data) => {
                nodecg.log.info(
                    data.data.displayName + " just hosted the stream for " + data.data.amount + "viewer(s)!",
                );
            });

            client.onRaid((data) => {
                nodecg.log.info(
                    data.data.displayName + " just raided the stream with " + data.data.amount + " viewers!",
                );
            });

            client.onTip((data) => {
                if (data.data.currency) {
                    nodecg.log.info(
                        data.data.username + " just donated " + data.data.amount + " " + data.data.currency + "!",
                    );
                }
            });
        },
        () => nodecg.log.info("SE client has been unset."),
    );
};
