import { NodeCG } from "nodecg/types/server";
import { NanoleafClient } from "nodecg-io-nanoleaf";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for nanoleafs started.");

    // Require the nanoleaf service
    const nanoleafClient = requireService<NanoleafClient>(nodecg, "nanoleaf");

    nanoleafClient?.onAvailable((client) => {
        nodecg.log.info("Nanoleaf client has been updated.");

        // Sets the color of all nanoleaf panels to the very best orange
        client.setSaturation(100);
        client.setBrightness(25);
        client.setHue(40);
    });

    nanoleafClient?.onUnavailable(() => nodecg.log.info("Nanoleaf client has been unset."));
};
