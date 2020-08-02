import { NodeCG } from "nodecg/types/server";
import { TwitchServiceClient } from "nodecg-io-twitch/extension";
import { requireService } from "nodecg-io-core/extension";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for twitch started");

    // Require the twitch service.
    const twitch = requireService<TwitchServiceClient>(nodecg, "twitch");

    // Hardcoded channels for testing purposes.
    // Note that this does need a # before the channel name and is case-insensitive.
    const twitchChannels = ["#daniel0611"];

    // Once the service instance has been set we add listeners for messages in the corresponding channels.
    twitch?.onAvailable((client) => {
        nodecg.log.info("Twitch client has been updated, adding handlers for messages.");

        twitchChannels.forEach((channel) => {
            addListeners(nodecg, client, channel);
        });
    });

    twitch?.onUnavailable(() => nodecg.log.info("Twitch client has been unset."));
};

function addListeners(nodecg: NodeCG, client: TwitchServiceClient, channel: string) {
    const tw = client.getRawClient();

    tw.join(channel)
        .then(() => {
            nodecg.log.info(`Connected to twitch channel "${channel}"`);
            tw.onPrivmsg((chan, user, message, _msg) => {
                if (chan === channel.toLowerCase()) {
                    nodecg.log.info(`Twitch chat: ${user}@${channel}: ${message}`);
                }
            });
            tw.say(channel, "Hello, nodecg-io speaking here!");
        })
        .catch((reason) => {
            nodecg.log.error(`Couldn't connect to twitch: ${reason}.`);
            nodecg.log.info("Retrying in 5 seconds.");
            setTimeout(() => addListeners(nodecg, client, channel), 5000);
        });
}
