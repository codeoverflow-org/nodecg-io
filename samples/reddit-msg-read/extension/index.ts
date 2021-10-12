import { NodeCG } from "nodecg-types/types/server";
import { RedditServiceClient } from "nodecg-io-reddit";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for discord started");

    const subreddit = "skate702";
    const reddit = requireService<RedditServiceClient>(nodecg, "reddit");

    reddit?.onAvailable(async (client) => {
        nodecg.log.info("Reddit client has been updated, checking for recent post.");
        const posts = await client.threads(subreddit);
        posts.forEach((post) => {
            nodecg.log.info(`Recent Post: ${post.title} by ${post.author}. Created: ${post.date}. See ${post.url}`);
        });
    });

    reddit?.onUnavailable(() => nodecg.log.info("Reddit client has been unset."));
};
