import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { DiscordServiceClient } from "nodecg-io-discord/extension";


module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for discord started");

    // This implicit cast determines the client type in the requireService call
    const discord: ServiceProvider<DiscordServiceClient> | undefined = nodecg.extensions["nodecg-io-discord"] as any;


    discord?.requireService("discord-guild-chat", (client) => {
        nodecg.log.info("Discord client has been updated, adding handlers for messages.");
        addListeners(nodecg, client);
    }, () => nodecg.log.info("Discord client has been unset."));
};

function addListeners(nodecg: NodeCG, client: DiscordServiceClient) {
    const dc = client.getRawClient();

    dc.on('ready', () => {
        console.log(`Logged in!`);
    });

    dc.on('message', msg => {
        if (msg.content === 'ping' || msg.content === '!ping') {
            msg.reply('pong');
        }
    });
}
