import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { TwitterServiceClient } from "nodecg-io-twitter/extension";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for twitter started");

    // This explicit cast determines the client type in the requireService call
    const twitter = (nodecg.extensions["nodecg-io-twitter"] as unknown) as
        | ServiceProvider<TwitterServiceClient>
        | undefined;

    twitter?.requireService(
        "twitter-timeline",
        (client) => {
            nodecg.log.info("Twitch client has been updated, adding handlers for messages.");
            const twitterClient = client.getRawClient();
            twitterClient
                .get("statuses/user_timeline", { screen_name: "skate702", exclude_replies: true, count: 50 }) // eslint-disable-line camelcase
                .then((tweets: any[]) => tweets.forEach((tweet: any) => nodecg.log.info(`Got tweet: ${tweet.text}`)))
                .catch((err: any) => nodecg.log.error(err));
        },
        () => nodecg.log.info("Twitter client has been unset!"),
    );
};
