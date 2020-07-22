import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { YoutubeServiceClient } from "nodecg-io-youtube/extension";

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
            nodecg.log.info(resp);
        },
        () => nodecg.log.info("Youtube client has been unset."),
    );
};
