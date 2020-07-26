import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { DiscordServiceClient } from "nodecg-io-discord/extension";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for discord started");

    const discord = (nodecg.extensions["nodecg-io-discord"] as unknown) as
        | ServiceProvider<DiscordServiceClient>
        | undefined;

    discord?.requireService(
        "discord-guild-chat",
        (client) => {
            nodecg.log.info("Discord client has been updated, adding handlers for messages.");
            addListeners(nodecg, client);
        },
        () => nodecg.log.info("Discord client has been unset."),
    );
};

function addListeners(nodecg: NodeCG, client: DiscordServiceClient) {
    const dc = client.getRawClient();

    dc.on("ready", () => {
        nodecg.log.info(`Logged in!`);
    });

    dc.on("message", (msg) => {
        if (msg.content === "ping" || msg.content === "!ping") {
            msg.reply("pong");
        }
    });
}
