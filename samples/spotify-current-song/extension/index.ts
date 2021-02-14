import { NodeCG } from "nodecg/types/server";
import { requireService } from "nodecg-io-core";
import { SpotifyServiceClient } from "nodecg-io-spotify";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for spotify started");

    const service = requireService<SpotifyServiceClient>(nodecg, "spotify");
    service?.onAvailable(async (client) => {
        nodecg.log.info("Spotify client has been updated, searching for current song information.");

        const track = await client.getMyCurrentPlayingTrack();
        const name = track.body.item?.name;
        const artists = track.body.item?.artists.map((a) => a.name);
        nodecg.log.info(`Currently playing "${name}" by "${artists}".`);
    });

    service?.onUnavailable(() => nodecg.log.info("Spotify client has been unset."));
};
