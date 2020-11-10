import { NodeCG } from "nodecg/types/server";
import { RedditServiceClient } from "nodecg-io-reddit/extension";
import { requireService } from "nodecg-io-core/extension/serviceClientWrapper";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for discord started");

    const subreddit = "skate702";
    const discord = requireService<RedditServiceClient>(nodecg, "reddit");

    discord?.onAvailable(async (client) => {
        nodecg.log.info("Reddit client has been updated.");
        const posts = await client.getNativeClient().threads(subreddit);
        posts.forEach((post) => {
            nodecg.log.info(`Recent Post: ${post.title} by ${post.author}. Created: ${post.date}. See ${post.url}`);
        });
    });

    discord?.onUnavailable(() => nodecg.log.info("Reddit client has been unset."));
};
