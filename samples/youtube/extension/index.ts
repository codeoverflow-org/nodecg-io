import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { YoutubeServiceClient } from "nodecg-io-youtube/extension";
import { youtube_v3 } from "googleapis";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for youtube started");

    // This explicit cast determines the client type in the requireService call
    const youtube = (nodecg.extensions["nodecg-io-youtube"] as unknown) as
        | ServiceProvider<YoutubeServiceClient>
        | undefined;

    youtube?.requireService(
        "youtube",
        async (client) => {
            const youtubeClient = client.getRawClient();
            const resp = await youtubeClient.playlists.list({
                part: ["id", "snippet"],
                id: ["PL9oBXB6tQnlX013V1v20WkfzI9R2zamHi"],
            });
            const items = resp.data.items;
            if (items) {
                const { title, channelTitle, publishedAt, description } = items[0]
                    .snippet as youtube_v3.Schema$PlaylistItemSnippet;
                nodecg.log.info(
                    `${title}${description ? " - " : ""}${description} by ${channelTitle} created at ${publishedAt}`,
                );
            }
        },
        () => nodecg.log.info("Youtube client has been unset."),
    );
};
