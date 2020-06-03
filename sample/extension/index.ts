import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { TwitchServiceClient } from "nodecg-io-twitch/extension";


module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for twitch started");

    // This implicit cast determines the client type in the requireService call
    const twitch: ServiceProvider<TwitchServiceClient> = nodecg.extensions["nodecg-io-twitch"] as any;

    // Hardcoded channels for testing purposes.
    // Note that this does need a # before the channel name and is case-insensitive.
    const twitchChannels = ["#skate702", "#daniel0611"];

    twitch.requireService("sample", (client) => {
        if (client === undefined) {
			nodecg.log.info("Twitch client has been unset.");
        } else {
			nodecg.log.info(`Twitch client has been updated, adding handlers for messages.`);

			twitchChannels.forEach((channel) => {
                addListeners(nodecg, client, channel);
            })
        }
    });
};

function addListeners(nodecg: NodeCG, client: TwitchServiceClient, channel: string) {
    const tw = client.getRawClient();

    tw.join(channel)
        .then(() => {
            nodecg.log.info(`Connected to twitch channel "${channel}"`)
            tw.onPrivmsg((chan, user, message, msg) => {
                if(chan === channel.toLowerCase()) {
                    nodecg.log.info(`Twitch chat: ${user}@${channel}: ${message}`);
                }
            });
            tw.say(channel, "Hello, NodeCG-IO speaking here!");
        })
        .catch((reason) => nodecg.log.error(reason));
}
