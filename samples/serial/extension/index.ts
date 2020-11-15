import { NodeCG } from "nodecg/types/server";
import { requireService } from "nodecg-io-core/extension/serviceClientWrapper";
import { SerialServiceClient } from "nodecg-io-serial";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for serial started");

    const service = requireService<SerialServiceClient>(nodecg, "serial");
    service?.onAvailable((client) => {
        nodecg.log.info("Client has been updated.");
        client.onData((data: string) => {
            nodecg.log.info(data);
        });

        setInterval(() => {
            client.send("ping\n");
        }, 10000);
    });

    service?.onUnavailable(() => nodecg.log.info("Client has been unset."));
};
