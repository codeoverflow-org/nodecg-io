import NodeCG from "@nodecg/types";
import { requireService } from "nodecg-io-core";
import { ArtNetServiceClient } from "nodecg-io-artnet";

module.exports = function (nodecg: NodeCG.ServerAPI) {
    nodecg.log.info("Sample bundle for Art-Net started");

    const service = requireService<ArtNetServiceClient>(nodecg, "artnet");
    let value = 0;
    let timeout: undefined | NodeJS.Timeout = undefined;

    service?.onAvailable((client) => {
        // From this point on is the artnet client available
        nodecg.log.info("Art-Net console has been updated, setting up interval for sending test payloads.");

        // Receive DMX data
        client.onDMX((dmx) => {
            // dmx contains an ArtDmx object
            nodecg.log.info(dmx.universe, dmx.data);
        });

        // Send DMX data to every channel and universe.
        timeout = setInterval(() => {
            // send new data every 0,8 seconds.
            // This is the official timing for re-transmiting data in the artnet specifciation.
            if (++value > 255) value = 0;
            for (let universe = 0; universe < 8; universe++) {
                client.send(
                    universe,
                    // the values of the 512 channels
                    Array(512).fill(value),
                );
            }
        }, 800);
    });

    service?.onUnavailable(() => {
        if (timeout) {
            clearInterval(timeout);
            value = 0;
        }
        nodecg.log.info("Art-Net console has been unset.");
    });
};
