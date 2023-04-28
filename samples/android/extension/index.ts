import NodeCG from "@nodecg/types";
import { AndroidServiceClient } from "nodecg-io-android";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG.ServerAPI) {
    nodecg.log.info("Sample bundle for android started");

    const a = requireService<AndroidServiceClient>(nodecg, "android");

    a?.onAvailable(async (android) => {
        nodecg.log.info("Android client has been updated, turning on WLAN.");

        const wifi = await android.getWifiManager();
        await wifi.setEnabled(true);
    });

    a?.onUnavailable(() => nodecg.log.info("Android client has been unset."));
};
