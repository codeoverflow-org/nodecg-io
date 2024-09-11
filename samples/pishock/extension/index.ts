import NodeCG from "@nodecg/types";
import { PiShockClient } from "nodecg-io-pishock";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG.ServerAPI) {
    nodecg.log.info("Sample bundle for the PiShock service started.");

    const pishock = requireService<PiShockClient>(nodecg, "pishock");

    pishock?.onAvailable((client) => {
        nodecg.log.info("PiShock client has been updated, printing all device's infos");
        client.connectedDevices.forEach(async (device) => {
            const info = await device.getInfo();
            nodecg.log.info(
                `Client ID: ${info.clientId}, ID: ${info.id}, Name: ${info.name}, Paused: ${info.paused}, ` +
                    `MaxIntensity: ${info.maxIntensity}, MaxDuration: ${info.maxDuration}, Online: ${info.online}`,
            );
        });
    });

    pishock?.onUnavailable(() => {
        nodecg.log.info("PiShock service unavailable.");
    });
};
