import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { PhilipsHueServiceClient } from "nodecg-io-philipshue/extension";

module.exports = function (nodecg: NodeCG): void {
    nodecg.log.info("Sample bundle for Philips Hue started");

    const hue = (nodecg.extensions["nodecg-io-philipshue"] as unknown) as
        | ServiceProvider<PhilipsHueServiceClient>
        | undefined;

    hue?.requireService(
        "hue-sample",
        (hue) => {
            nodecg.log.info("Got Philips Hue client");

            const client = hue.getRawClient();

            client.lights.getAll().then((lights) => {
                nodecg.log.info(lights.length);
            });
        },
        () => nodecg.log.info("Philips Hue client has been unset."),
    );
};
