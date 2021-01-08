import { NodeCG } from "nodecg/types/server";
import { DiscordServiceClient } from "nodecg-io-discord";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for discord started");

    const discord = requireService<DiscordServiceClient>(nodecg, "discord");

    discord?.onAvailable((client) => {
        nodecg.log.info("Discord client has been updated, adding handlers for messages.");
        addListeners(nodecg, client);
    });

    discord?.onUnavailable(() => nodecg.log.info("Discord client has been unset."));
};

function addListeners(nodecg: NodeCG, client: DiscordServiceClient) {
    const dc = client.getNativeClient();

    dc.on("ready", () => {
        nodecg.log.info(`Logged in!`);
    });

    dc.on("message", (msg) => {
        if (msg.content === "ping" || msg.content === "!ping") {
            msg.reply("pong");
        }
    });
}
