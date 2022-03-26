import { NodeCG } from "nodecg-types/types/server";
import { DiscordRpcClient } from "nodecg-io-discord-rpc";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for DiscordRpc started.");

    const discordRpc = requireService<DiscordRpcClient>(nodecg, "discord-rpc");

    discordRpc?.onAvailable((client) => {
        nodecg.log.info("DiscordRpc service available. Username: " + client.user?.username);
    });

    discordRpc?.onUnavailable(() => {
        nodecg.log.info("DiscordRpc service unavailable.");
    });
};
