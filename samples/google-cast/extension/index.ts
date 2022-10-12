import { NodeCG } from "nodecg-types/types/server";
import { GoogleCastClient } from "nodecg-io-google-cast";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for the google-cast service started.");

    const googleCast = requireService<GoogleCastClient>(nodecg, "google-cast");

    let previousDevice: GoogleCastClient | undefined = undefined;

    googleCast?.onAvailable((castDevice) => {
        nodecg.log.info("google-cast service available.");
        previousDevice = castDevice;

        const deviceName = castDevice.friendlyName.length !== 0 ? castDevice.friendlyName : castDevice.host;

        castDevice.play("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", (err) => {
            if (err === null)
                nodecg.log.info(`Successfully started playing sample media on google cast device ${deviceName}`);
            else nodecg.log.error(`Failed to play media on google cast device ${deviceName}: ${err}`);
        });
    });

    googleCast?.onUnavailable(() => {
        nodecg.log.info("google-cast service unavailable.");

        if (previousDevice !== undefined) {
            previousDevice.stop((err) => {
                if (err !== null) nodecg.log.info("Stopped playback on previous google cast device.");
            });
            previousDevice = undefined;
        }
    });
};
