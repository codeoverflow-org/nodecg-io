import { NodeCG } from "nodecg/types/server";
import { PhilipsHueServiceClient } from "nodecg-io-philipshue";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG): void {
    nodecg.log.info("Sample bundle for Philips Hue started");

    const hue = requireService<PhilipsHueServiceClient>(nodecg, "philipshue");

    hue?.onAvailable((hue) => {
        nodecg.log.info("Philips Hue client has been updated, counting lights.");

        const client = hue.getNativeClient();

        client.lights.getAll().then((lights) => {
            nodecg.log.info(lights.length);
        });
    });

    hue?.onUnavailable(() => nodecg.log.info("Philips Hue client has been unset."));
};
