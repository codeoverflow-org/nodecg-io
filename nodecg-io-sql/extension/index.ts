import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { SQLClient } from "./sqlClient";

export interface SQLConfig {
    client: string;
    connection: Record<string, unknown>;
}

export { SQLClient } from "./sqlClient";

module.exports = (nodecg: NodeCG) => {
    new SQLService(nodecg, "sql", __dirname, "../schema.json").register();
};

class SQLService extends ServiceBundle<SQLConfig, SQLClient> {
    async validateConfig(_: SQLConfig): Promise<Result<void>> {
        // TODO: Implement
        return emptySuccess();
    }

    async createClient(config: SQLConfig): Promise<Result<SQLClient>> {
        // TODO: Implement
        const client = SQLClient.createClient(config);
        this.nodecg.log.info("Successfully created sql client.");
        return success(client);
    }

    stopClient(_: SQLClient): void {
        // TODO: Implement
        this.nodecg.log.info("Successfully stopped sql client.");
    }

    removeHandlers(_: SQLClient): void {
        // TODO: Implement (optional)
    }
}
