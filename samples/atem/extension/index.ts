import { NodeCG } from "nodecg-types/types/server";
import { requireService } from "nodecg-io-core";
import { AtemServiceClient } from "nodecg-io-atem";
import { Commands } from "atem-connection";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for Atem Protocol started.");

    const service = requireService<AtemServiceClient>(nodecg, "atem");

    service?.onAvailable((client) => {
        client.on("connected", () => nodecg.log.info("Atem connected to server."));
        client.on("receivedCommands", (e: Commands.IDeserializedCommand[]) => nodecg.log.info(e));
        client.on("error", (e) => nodecg.log.error(e));
    });

    service?.onUnavailable(() => {
        nodecg.log.info("Connect to Atem server closed.");
    });
};
