import { NodeCG } from "nodecg/types/server";
import { requireService } from "nodecg-io-core";
import { SpotifyServiceClient } from "nodecg-io-spotify";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for spotify started");

    const service = requireService<SpotifyServiceClient>(nodecg, "spotify");
    service?.onAvailable(async (client) => {
        nodecg.log.info("Spotify client has been updated, searching for current song information.");

        const trackResponse = await client.getMyCurrentPlayingTrack();
        const track = trackResponse.body.item;
        if (track) {
            const name = track.name;
            const artists = track.type === "track" ? track.artists.map((a) => a.name) : "unknown";
            nodecg.log.info(`Currently playing "${name}" by "${artists}".`);
        } else {
            nodecg.log.info("Not playing anthing right now.");
        }
    });

    service?.onUnavailable(() => nodecg.log.info("Spotify client has been unset."));
};
