import { NodeCG } from "nodecg-types/types/server";
import { requireService } from "nodecg-io-core";
import { IRCServiceClient } from "nodecg-io-irc";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for irc started.");

    const service = requireService<IRCServiceClient>(nodecg, "irc");
    service?.onAvailable((client) => {
        nodecg.log.info("IRC client has been updated.");
        client.join("#skate702"); // Change this channel, if you want to connect to a different channel.

        client.addListener("message", (from, to, message) => {
            nodecg.log.info(from + " => " + to + ": " + message);
        });

        client.addListener("error", function (message) {
            nodecg.log.info("error: ", message);
        });
    });

    service?.onUnavailable(() => nodecg.log.info("IRC client has been unset."));
};
