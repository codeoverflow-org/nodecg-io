import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { TwitchServiceClient } from "nodecg-io-twitch/extension";
import { StreamElementsServiceClient } from "nodecg-io-streamelements/extension";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for twitch started");

    // This explicit cast determines the client type in the requireService call
    const twitch = (nodecg.extensions["nodecg-io-twitch"] as unknown) as
        | ServiceProvider<TwitchServiceClient>
        | undefined;

    const se = (nodecg.extensions["nodecg-io-streamelements"] as unknown) as
        | ServiceProvider<StreamElementsServiceClient>
        | undefined;

    // Hardcoded channels for testing purposes.
    // Note that this does need a # before the channel name and is case-insensitive.
    const twitchChannels = ["#skate702", "#daniel0611"];

    se?.requireService(
        "twitch-chat",
        (client) => {
            nodecg.log.info("SE has been set.");
            client.getRawClient().onSubscriber((data: any) => {
                nodecg.log.info(`Neuer sub: ${data.data.displayName}`);
            });
        },
        () => nodecg.log.info("Unset."),
    );
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
            nodecg.log.info(`Retrying in 5 seconds.`);
            setTimeout(() => addListeners(nodecg, client, channel), 5000);
        });
}
