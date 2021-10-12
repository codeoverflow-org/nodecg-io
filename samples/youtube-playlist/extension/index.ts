import { NodeCG } from "nodecg-types/types/server";
import { GoogleApisServiceClient } from "nodecg-io-googleapis";
import { requireService } from "nodecg-io-core";
import type { youtube_v3 } from "googleapis";

module.exports = (nodecg: NodeCG) => {
    nodecg.log.info("Sample bundle for youtube started");

    const googleApis = requireService<GoogleApisServiceClient>(nodecg, "googleapis");

    googleApis?.onAvailable(async (client) => {
        const youtube = client.youtube("v3");

        nodecg.log.info("Youtube client has been updated, listing videos from playlist.");
        const resp = await youtube.playlists.list({
            part: ["id", "snippet"],
            id: ["PL9oBXB6tQnlX013V1v20WkfzI9R2zamHi"],
        });
        const items = resp.data.items;
        if (items && items[0]) {
            const { title, channelTitle, publishedAt, description } = items[0]
                .snippet as youtube_v3.Schema$PlaylistItemSnippet;
            nodecg.log.info(
                `${title}${description ? " - " : ""}${description} by ${channelTitle} created at ${publishedAt}`,
            );
        }
    });

    googleApis?.onUnavailable(() => nodecg.log.info("Youtube client has been unset."));
};
