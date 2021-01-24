import { NodeCG } from "nodecg/types/server";
import { TwitchServiceClient } from "nodecg-io-twitch-chat";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for twitch-chat started");

    // Require the twitch service.
    const twitch = requireService<TwitchServiceClient>(nodecg, "twitch-chat");

    // Hardcoded channels for testing purposes.
    // Note that this does need a # before the channel name and is case-insensitive.
    const twitchChannels = ["#skate702", "#daniel0611"];

    // Once the service instance has been set we add listeners for messages in the corresponding channels.
    twitch?.onAvailable((client) => {
        nodecg.log.info("Twitch chat client has been updated, adding handlers for messages.");

        twitchChannels.forEach((channel) => {
            addListeners(nodecg, client, channel);
        });
    });

    twitch?.onUnavailable(() => nodecg.log.info("Twitch chat client has been unset."));
};

function addListeners(nodecg: NodeCG, client: TwitchServiceClient, channel: string) {
    client
        .join(channel)
        .then(() => {
            nodecg.log.info(`Connected to twitch channel "${channel}"`);

            client.getNativeClient().onMessage((chan, user, message, _msg) => {
                if (chan === channel.toLowerCase()) {
                    nodecg.log.info(`Twitch chat: ${user}@${channel}: ${message}`);
                }
            });

            client.getNativeClient().say(channel, "Hello, nodecg-io speaking here!");
        })
        .catch((reason) => {
            nodecg.log.error(`Couldn't connect to twitch: ${reason}.`);
            nodecg.log.info("Retrying in 5 seconds.");
            setTimeout(() => addListeners(nodecg, client, channel), 5000);
        });
}
