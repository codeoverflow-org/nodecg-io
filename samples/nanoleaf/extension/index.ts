import NodeCG from "@nodecg/types";
import { NanoleafServiceClient } from "nodecg-io-nanoleaf";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG.ServerAPI) {
    nodecg.log.info("Sample bundle for nanoleafs started.");

    // Require the nanoleaf service
    const nanoleafClient = requireService<NanoleafServiceClient>(nodecg, "nanoleaf");

    nanoleafClient?.onAvailable(async (client) => {
        nodecg.log.info("Nanoleaf client has been updated.");

        // Sets the color of all nanoleaf panels to the very best orange
        await client.setSaturation(100);
        await client.setBrightness(25);
        await client.setHue(40);
    });

    nanoleafClient?.onUnavailable(() => nodecg.log.info("Nanoleaf client has been unset."));
};
