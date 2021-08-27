import { NodeCG } from "nodecg/types/server";
import { ElgatoLightClient } from "nodecg-io-elgato-light";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for the Elgato light service started.");

    const elgatoLightClient = requireService<Array<ElgatoLightClient>>(nodecg, "elgato-light");

    elgatoLightClient?.onAvailable((clients) => {
        nodecg.log.info("Elgato light service available.");

        // TODO: Create a more comprehensive example
        clients.forEach((client) => client.toggleLight());
    });

    elgatoLightClient?.onUnavailable(() => {
        nodecg.log.info("Elgato light service unavailable.");
    });
};
