import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { Knex, knex } from "knex";

export interface SQLConfig {
    client: string;
    connection: Record<string, unknown>;
}

module.exports = (nodecg: NodeCG) => {
    new SQLService(nodecg, "sql", __dirname, "../schema.json").register();
};

class SQLService extends ServiceBundle<SQLConfig, Knex> {
    private knexInstance: Knex;

    async validateConfig(_: SQLConfig): Promise<Result<void>> {
        // No way to validate without creating the client
        return emptySuccess();
    }

    async createClient(config: SQLConfig): Promise<Result<Knex>> {
        this.knexInstance = knex(config);
        this.nodecg.log.info("Successfully created sql client.");
        return success(this.knexInstance);
    }

    stopClient(client: Knex): void {
        client.destroy();
        this.nodecg.log.info("Successfully stopped sql client.");
    }
}
