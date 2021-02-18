import { NodeCG } from "nodecg/types/server";
import { YoutubeServiceClient } from "nodecg-io-youtube";
import { youtube_v3 } from "googleapis";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for youtube started");

    const youtube = requireService<YoutubeServiceClient>(nodecg, "youtube");

    youtube?.onAvailable(async (client) => {
        nodecg.log.info("Youtube client has been updated, listing videos from playlist.");
        const resp = await client.playlists.list({
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
    });

    youtube?.onUnavailable(() => nodecg.log.info("Youtube client has been unset."));
};
