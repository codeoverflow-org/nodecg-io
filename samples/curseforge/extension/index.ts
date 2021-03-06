import { NodeCG } from "nodecg/types/server";
import { CurseForgeClient } from "nodecg-io-curseforge";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for Curseforge started.");

    const curseforge = requireService<CurseForgeClient>(nodecg, "curseforge");

    curseforge?.onAvailable(async (client) => {
        const addon = await client.getAddon(275351);
        nodecg.log.info(JSON.stringify(addon));
        nodecg.log.info("Curseforge service available.");
    });

    curseforge?.onUnavailable(() => {
        nodecg.log.info("Curseforge service unavailable.");
        // TODO: Implement
    });
};
