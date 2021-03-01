import { NodeCG } from "nodecg/types/server";
import { TemplateClient } from "nodecg-io-template";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for the template service started.");

    const template = requireService<TemplateClient>(nodecg, "template");

    template?.onAvailable((_) => {
        nodecg.log.info("Template service available.");
        // TODO: Implement
    });

    template?.onUnavailable(() => {
        nodecg.log.info("Template service unavailable.");
        // TODO: Implement
    });
};
