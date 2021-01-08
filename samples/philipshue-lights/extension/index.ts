import { NodeCG } from "nodecg/types/server";
import { PhilipsHueServiceClient } from "nodecg-io-philipshue";
import { requireService } from "nodecg-io-core/extension/serviceClientWrapper";

module.exports = function (nodecg: NodeCG): void {
    nodecg.log.info("Sample bundle for Philips Hue started");

    const hue = requireService<PhilipsHueServiceClient>(nodecg, "philipshue");

    hue?.onAvailable((hue) => {
        nodecg.log.info("Got Philips Hue client");

        const client = hue.getNativeClient();

        client.lights.getAll().then((lights) => {
            nodecg.log.info(lights.length);
        });
    });

    hue?.onUnavailable(() => nodecg.log.info("Philips Hue client has been unset."));
};
