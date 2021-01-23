import { NodeCG } from "nodecg/types/server";
import { TwitchApiServiceClient } from "nodecg-io-twitch-api";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for twitch-api started");

    const twitchApi = requireService<TwitchApiServiceClient>(nodecg, "twitch-api");

    twitchApi?.onAvailable(async (client) => {
        nodecg.log.info("Twitch api client has been updated, getting user info.");
        const c = client.getNativeClient();
        const user = await c.helix.users.getMe();
        const follows = await user.getFollows();
        const stream = await user.getStream();
        nodecg.log.info(
            `You are user "${user.name}", follow ${follows.total} people and are ${
                stream === null ? "not" : ""
            } streaming.`,
        );
    });

    twitchApi?.onUnavailable(() => nodecg.log.info("Twitch api client has been unset."));
};
