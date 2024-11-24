import NodeCG from "@nodecg/types";
import { TwitchApiServiceClient } from "nodecg-io-twitch-api";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG.ServerAPI) {
    nodecg.log.info("Sample bundle for twitch-api started");

    const twitchApi = requireService<TwitchApiServiceClient>(nodecg, "twitch-api");

    twitchApi?.onAvailable(async (client) => {
        nodecg.log.info("Twitch api client has been updated, getting user info.");
        const tokenInfo = await client.getTokenInfo();
        const userId = tokenInfo.userId;

        if (!userId) {
            nodecg.log.info("Unable to determine authenticated user");
            return;
        }

        const user = await client.users.getUserById(userId);
        if (!user) {
            nodecg.log.info("Unable to get user info");
            return;
        }

        const follows = await user?.getFollowedChannels();
        const stream = await user?.getStream();
        nodecg.log.info(
            `You are user "${user.name}", follow ${follows.total} people and are${stream === null ? " not" : ""} streaming.`,
        );
    });

    twitchApi?.onUnavailable(() => nodecg.log.info("Twitch api client has been unset."));
};
