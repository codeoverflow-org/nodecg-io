import { NodeCG } from "nodecg/types/server";
import { ElgatoLightClient } from "nodecg-io-elgato-light";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for the Elgato light service started.");

    const elgatoLightClient = requireService<ElgatoLightClient>(nodecg, "elgato-light");

    elgatoLightClient?.onAvailable((client) => {
        nodecg.log.info("Elgato light service available.");

        // TODO: Create a more comprehensive example
        client.getAllLights().forEach((light) => light.toggleLight());
    });

    elgatoLightClient?.onUnavailable(() => {
        nodecg.log.info("Elgato light service unavailable.");
    });
};
