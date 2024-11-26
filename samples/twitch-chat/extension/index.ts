import NodeCG from "@nodecg/types";
import { TwitchChatServiceClient } from "nodecg-io-twitch-chat";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG.ServerAPI) {
    nodecg.log.info("Sample bundle for twitch-chat started");

    // Require the twitch service.
    const twitch = requireService<TwitchChatServiceClient>(nodecg, "twitch-chat");

    // Hardcoded channels for testing purposes.
    // Note that this is case-insensitive.
    const twitchChannels = ["skate702", "hlxid"];

    // Once the service instance has been set we add listeners for messages in the corresponding channels.
    twitch?.onAvailable((client) => {
        nodecg.log.info("Twitch chat client has been updated, adding handlers for messages.");

        twitchChannels.forEach((channel) => {
            addListeners(nodecg, client, channel);
        });
    });

    twitch?.onUnavailable(() => nodecg.log.info("Twitch chat client has been unset."));
};

function addListeners(nodecg: NodeCG.ServerAPI, client: TwitchChatServiceClient, channel: string) {
    client
        .join(channel)
        .then(() => {
            nodecg.log.info(`Connected to twitch channel "${channel}"`);

            client.onMessage((chan, user, message, _msg) => {
                if (chan === channel.toLowerCase()) {
                    nodecg.log.info(`Twitch chat: ${user}@${channel}: ${message}`);
                }
            });
        })
        .catch((reason) => {
            nodecg.log.error(`Couldn't connect to twitch: ${reason}.`);
            nodecg.log.info("Retrying in 5 seconds.");
            setTimeout(() => addListeners(nodecg, client, channel), 5000);
        });
}
