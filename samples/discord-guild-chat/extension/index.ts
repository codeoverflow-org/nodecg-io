import { NodeCG } from "nodecg/types/server";
import { DiscordServiceClient } from "nodecg-io-discord";
import { requireService } from "nodecg-io-core/extension/serviceClientWrapper";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for discord started");

    const discord = requireService<DiscordServiceClient>(nodecg, "discord");

    discord?.onAvailable((client) => {
        nodecg.log.info("Discord client has been updated, adding handlers for messages.");
        addListeners(client);
    });

    discord?.onUnavailable(() => nodecg.log.info("Discord client has been unset."));
};

function addListeners(client: DiscordServiceClient) {
    const dc = client.getNativeClient();

    dc.on("message", (msg) => {
        if (msg.content === "ping" || msg.content === "!ping") {
            msg.reply("pong");
        }
    });
}
