import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { TwitchClient } from "nodecg-io-twitch/extension";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for twitch started");
    const twitch: ServiceProvider<TwitchClient> = nodecg.extensions["nodecg-io-twitch"] as any;

    twitch.requireService("sample", (client) => {
        if (client === undefined) {
			nodecg.log.info("Twitch client has been unset.");
        } else {
			nodecg.log.info("Twitch client has been updated.");
			nodecg.log.info(JSON.stringify(client));
        }
    });
};
