import { NodeCG } from "nodecg/types/server";
import { requireService } from "nodecg-io-core/extension/serviceClientWrapper";
import { SpotifyServiceClient } from "nodecg-io-spotify";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for spotify started");

    const service = requireService<SpotifyServiceClient>(nodecg, "spotify");
    service?.onAvailable(async (client) => {
        nodecg.log.info("Client has been updated.");

        const track = await client.getNativeClient().getMyCurrentPlayingTrack();
        const name = track.body.item?.name;
        const artists = track.body.item?.artists.map((a) => a.name);
        nodecg.log.info(`Currently playing "${name}" by "${artists}".`);
    });

    service?.onUnavailable(() => nodecg.log.info("Client has been unset."));
};
