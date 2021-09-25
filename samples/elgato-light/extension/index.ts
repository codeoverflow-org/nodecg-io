import { NodeCG } from "nodecg-types/types/server";
import { ElgatoLightClient } from "nodecg-io-elgato-light";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for the Elgato light service started.");

    const elgatoLightClient = requireService<ElgatoLightClient>(nodecg, "elgato-light");

    elgatoLightClient?.onAvailable(async (client) => {
        nodecg.log.info("Elgato light service available.");

        // Blinky Blinky
        const interval = setInterval(() => client.getAllLights().forEach((light) => light.toggleLight()), 500);
        setTimeout(() => clearInterval(interval), 3100);

        // Get some data
        client.getAllLights().forEach(async (light) => {
            const brightness = await light.getBrightness();
            nodecg.log.info(`Elgato light (${light.ipAddress}), brightness: ${brightness}`);
        });
    });

    elgatoLightClient?.onUnavailable(() => {
        nodecg.log.info("Elgato light service unavailable.");
    });
};
