import { NodeCG } from "nodecg/types/server";
import { requireService } from "nodecg-io-core";
import { SQLCLient } from "nodecg-io-sql";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for the template service started.");

    const sql = requireService<SQLCLient>(nodecg, "sql");

    sql?.onAvailable((sqlClient) => {
        nodecg.log.info("SQL service available.");

        // TODO SH: Add some sample code incl. explanations
    });

    sql?.onUnavailable(() => {
        nodecg.log.info("SQL service unavailable.");
    });
};
