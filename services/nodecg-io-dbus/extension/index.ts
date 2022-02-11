import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle, Logger } from "nodecg-io-core";
import { DBusClient } from "./dbusClient";
import * as dbus from "dbus-next";

export interface DBusConfig {
    busAddress?: string;
}

export * from "./dbusClient";

module.exports = (nodecg: NodeCG) => {
    new DBusService(nodecg, "dbus", __dirname, "../schema.json").register();
};

class DBusService extends ServiceBundle<DBusConfig, DBusClient> {
    async validateConfig(config: DBusConfig): Promise<Result<void>> {
        dbus.sessionBus(config);
        return emptySuccess();
    }

    async createClient(config: DBusConfig, logger: Logger): Promise<Result<DBusClient>> {
        const client = DBusClient.createClient(config);
        logger.info("Successfully created dbus client.");
        return success(client);
    }

    stopClient(client: DBusClient, logger: Logger): void {
        client.session.disconnect();
        client.system.disconnect();
        logger.info("Successfully stopped dbus client.");
    }

    removeHandlers(client: DBusClient): void {
        client.session.removeAllListeners();
        client.system.removeAllListeners();
    }
}
