import { NodeCG } from "nodecg/types/server";
import { requireService } from "nodecg-io-core/extension/serviceClientWrapper";
import { IRCServiceClient } from "nodecg-io-irc/extension";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for <the-service-name> started");

    const service = requireService<IRCServiceClient>(nodecg, "irc");
    service?.onAvailable((client) => {
        nodecg.log.info("IRCclient has been updated.");
        const chat = client.getNativeClient();
        chat.join("#skate702"); // Change this channel, if you want to connet to a different channel.

        chat.addListener("message", (from, to, message) => {
            console.log(from + " => " + to + ": " + message);
        });

        chat.addListener("error", function (message) {
            console.log("error: ", message);
        });
    });

    service?.onUnavailable(() => nodecg.log.info("IRCclient has been unset."));
};
