import { NodeCG } from "nodecg/types/server";
import { XdotoolServiceClient } from "nodecg-io-xdotool/extension";
import { requireService } from "nodecg-io-core/extension/serviceClientWrapper";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for xdotool started");

    const xdotool = requireService<XdotoolServiceClient>(nodecg, "xdotool");

    xdotool?.onAvailable((client) => {
        nodecg.log.info("Xdotool client has been updated, minimising current window.");

        client.getRawClient().sendCommand("getactivewindow windowminimize");
    });

    xdotool?.onUnavailable(() => nodecg.log.info("Xdotool client has been unset."));
};
