import { NodeCG } from "nodecg-types/types/server";
import { requireService } from "nodecg-io-core";
import { MQTTClientServiceClient } from "nodecg-io-mqtt-client";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for websocket-client started");

    const service = requireService<MQTTClientServiceClient>(nodecg, "mqtt-client");
    let interval: NodeJS.Timeout | undefined;

    service?.onAvailable((client) => {
        nodecg.log.info("Client has been updated, waiting for messages.");

        client.onMessage((topic: string, message: Buffer) => {
            nodecg.log.info(`recieved message "${message.toString()}" "${topic}"`);
        });
    });

    service?.onUnavailable(() => {
        nodecg.log.info("Client has been unset.");
        if (interval) {
            clearInterval(interval);
        }
    });
};
