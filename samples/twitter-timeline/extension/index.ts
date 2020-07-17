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
            const twitterClient = client.getNativeClient();
            const params = {
                screen_name: "skate702", // eslint-disable-line camelcase
                exclude_replies: true, // eslint-disable-line camelcase
                count: 50,
            };
            twitterClient
                .get("statuses/user_timeline", params)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .then((tweets: any[]) => tweets.forEach((tweet) => nodecg.log.info(`Got tweet: ${tweet.text}`)))
                .catch((err) => nodecg.log.error(err));
        },
        () => nodecg.log.info("Twitter client has been unset!"),
    );
};
