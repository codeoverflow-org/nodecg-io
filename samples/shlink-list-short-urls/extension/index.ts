import NodeCG from "@nodecg/types";
import { requireService } from "nodecg-io-core";
import { ShlinkServiceClient } from "nodecg-io-shlink";

module.exports = function (nodecg: NodeCG.ServerAPI) {
    nodecg.log.info("Sample bundle for Shlink started");

    const service = requireService<ShlinkServiceClient>(nodecg, "shlink");

    service?.onAvailable((client) => {
        nodecg.log.info("Shlink client has been updated.");

        client.getShortUrls().then((response) => {
            nodecg.log.info(
                `Received ${response.pagination.totalItems} short urls from Shlink server (on first page).`,
            );
        });
    });

    service?.onUnavailable(() => nodecg.log.info("Shlink client has been unset."));
};
