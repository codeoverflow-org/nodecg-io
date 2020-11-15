import { NodeCG } from "nodecg/types/server";
import { requireService } from "nodecg-io-core/extension/serviceClientWrapper";
import { OBSServiceClient } from "nodecg-io-obs";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for OBS started");

    const obs = requireService<OBSServiceClient>(nodecg, "obs");

    obs?.onAvailable((client) => {
        nodecg.log.info("OBS client has been updated.");
        client
            .getNativeClient()
            .send("GetSceneList")
            .then((data) => {
                nodecg.log.info(`There are ${data.scenes.length} scenes!`);
            });
        client.getNativeClient().on("SwitchScenes", (data) => {
            nodecg.log.info(`Scene changed to ${data["scene-name"]}`);
        });
    });

    obs?.onUnavailable(() => nodecg.log.info("OBS client has been unset."));
};
