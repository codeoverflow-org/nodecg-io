import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { XdotoolServiceClient } from "nodecg-io-xdotool/extension";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for xdotool started");

    // This explicit cast determines the client type in the requireService call
    const xdotool = (nodecg.extensions["nodecg-io-xdotool"] as unknown) as
        | ServiceProvider<XdotoolServiceClient>
        | undefined;

    xdotool?.requireService(
        "xdotool",
        (client) => {
            nodecg.log.info("Xdotool client has been updated, minimising current window.");

            client.getRawClient().sendCommand("getactivewindow windowminimize");
        },
        () => nodecg.log.info("Xdotool client has been unset."),
    );
};
