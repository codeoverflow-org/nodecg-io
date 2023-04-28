import NodeCG from "@nodecg/types";
import { DBusClient } from "nodecg-io-dbus";
import { RatBagManager } from "nodecg-io-dbus/extension/ratbag";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG.ServerAPI) {
    nodecg.log.info("Sample bundle for Dbus started.");

    const dbus = requireService<DBusClient>(nodecg, "dbus");

    dbus?.onAvailable(async (client) => {
        nodecg.log.info("DBus service available.");
        const ratbag = await client.proxy(RatBagManager.PROXY);
        const devices = await ratbag.devices();
        nodecg.log.info("ratbagd devices:");
        for (const device of devices) {
            nodecg.log.info(" - " + (await device.name()));
        }
    });

    dbus?.onUnavailable(() => {
        nodecg.log.info("DBus service unavailable.");
    });
};
