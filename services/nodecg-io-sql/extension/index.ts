import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle, error, Logger } from "nodecg-io-core";
import { Knex, knex } from "knex";

// PG connection string is currently unsupported
export interface SQLConfig {
    client: string;
    logger: Logger;
    connection: Record<string, unknown>;
}

// any is the upper type limit of knex for the TRecord type. Bundles can use a more specific type if they want to.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SQLClient = Knex<any, unknown[]>;

module.exports = (nodecg: NodeCG) => {
    new SQLService(nodecg, "sql", __dirname, "../schema.json").register();
};

class SQLService extends ServiceBundle<SQLConfig, SQLClient> {
    async validateConfig(config: SQLConfig): Promise<Result<void>> {
        // No way to validate without creating the client, thus only statically validating the configs

        if (config.client === "mysql" || config.client === "pg") {
            if (
                !config.connection.host ||
                !config.connection.user ||
                !config.connection.password ||
                !config.connection.database
            ) {
                return error("Invalid config. Either host, user, password or database is missing.");
            }
        } else if (config.client === "sqlite3" && !config.connection.filename) {
            return error("Invalid config. Filename is missing.");
        }

        return emptySuccess();
    }

    async createClient(config: SQLConfig, logger: Logger): Promise<Result<SQLClient>> {
        const knexInstance = knex(config);
        logger.info("Successfully created sql client.");
        return success(knexInstance);
    }

    stopClient(client: SQLClient, logger: Logger): void {
        client.destroy();
        logger.info("Successfully stopped sql client.");
    }
}
