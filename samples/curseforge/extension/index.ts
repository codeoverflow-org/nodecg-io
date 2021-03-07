import { NodeCG } from "nodecg/types/server";
import { CurseForgeClient } from "nodecg-io-curseforge";
import { requireService } from "nodecg-io-core";
import { CurseAddon } from "nodecg-io-curseforge/extension/curseforgeClient";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for Curseforge started.");

    const curseforge = requireService<CurseForgeClient>(nodecg, "curseforge");

    curseforge?.onAvailable(async (client) => {
        nodecg.log.info("Curseforge service available.");
        const addonIds: number[] = [346054, 400058, 408447, 438104];
        const addons: CurseAddon[] = await client.getMultipleAddons(addonIds);
        nodecg.log.info("Here are the projects which belongs to the ids:");
        addons.forEach((addon) => {
            nodecg.log.info(`- '${addon.info.name}' (${addon.info.gameName} addon) by ${addon.info.authors[0].name}`);
        });

        const query = {
            gameId: 432, // minecraft
            sectionId: 6, // mods
            gameVersion: "1.16.5",
            searchFilter: "MelanX",
        };
        const response = await client.searchForAddons(query);
        nodecg.log.info("All 1.16.5 Minecraft mods by MelanX:");
        response.forEach((addon) => {
            nodecg.log.info(`- ${addon.info.name}`);
        });
    });

    curseforge?.onUnavailable(() => {
        nodecg.log.info("Curseforge service unavailable.");
    });
};
