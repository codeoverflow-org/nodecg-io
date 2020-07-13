import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { AHKServiceClient } from "nodecg-io-ahk/extension";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for AHK started");

    // This explicit cast determines the client type in the requireService call
    const ahkClient = (nodecg.extensions["nodecg-io-ahk"] as unknown) as ServiceProvider<AHKServiceClient> | undefined;

    ahkClient?.requireService(
        "ahk",
        (client) => {
            nodecg.log.info("AHK client has been updated, sending Hello World Command.");

            client.getRawClient().sendCommand("HelloWorld");
        },
        () => nodecg.log.info("AHK client has been unset."),
    );
};
