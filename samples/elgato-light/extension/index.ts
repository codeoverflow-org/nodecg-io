import { NodeCG } from "nodecg/types/server";
import { ElgatoKeyLight, ElgatoLightClient, ElgatoLightStrip } from "nodecg-io-elgato-light";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for the Elgato light service started.");

    const elgatoLightClient = requireService<ElgatoLightClient>(nodecg, "elgato-light");

    elgatoLightClient?.onAvailable(async (client) => {
        nodecg.log.info("Elgato light service available.");

        //client.getAllLights().forEach((light) => light.toggleLight());
        //const brightness = await((client.getLightByName("ShelfStrip")) as ElgatoLightStrip).getHue();
        //nodecg.log.info(brightness);

        //(client.getLightByName("ShelfStrip") as ElgatoLightStrip).setHue(69);
        //(client.getLightByName("ShelfStrip") as ElgatoLightStrip).setSaturation(50);

        // TODO: Add 10^6/kelvin calculation
        // TODO: Add typescript doc
        // TODO: Create a more comprehensive example
    });

    elgatoLightClient?.onUnavailable(() => {
        nodecg.log.info("Elgato light service unavailable.");
    });
};
