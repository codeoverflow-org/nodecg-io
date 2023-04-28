import NodeCG from "@nodecg/types";
import { requireService } from "nodecg-io-core";
import { OBSServiceClient } from "nodecg-io-obs";

module.exports = function (nodecg: NodeCG.ServerAPI) {
    nodecg.log.info("Sample bundle for OBS started");

    const obs = requireService<OBSServiceClient>(nodecg, "obs");

    obs?.onAvailable((client) => {
        nodecg.log.info("OBS client has been updated, counting scenes and detecting when switching to another one.");
        client.call("GetSceneList").then((data) => {
            nodecg.log.info(`There are ${data.scenes.length} scenes!`);
        });
        client.on("CurrentProgramSceneChanged", (data) => {
            nodecg.log.info(`Scene changed to ${data.sceneName}.`);
        });
    });

    obs?.onUnavailable(() => nodecg.log.info("OBS client has been unset."));
};
