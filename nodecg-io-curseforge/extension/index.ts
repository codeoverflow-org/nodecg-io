import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { CurseForge } from "./curseforgeClient";

export type CurseforgeConfig = {
    // Not required
};

export type CurseForgeClient = CurseForge;
export { SORT_TYPES } from "mc-curseforge-api";

module.exports = (nodecg: NodeCG) => {
    new CurseforgeService(nodecg, "curseforge", __dirname, "../schema.json").register();
};

class CurseforgeService extends ServiceBundle<CurseforgeConfig, CurseForgeClient> {
    async validateConfig(_: CurseforgeConfig): Promise<Result<void>> {
        return emptySuccess();
    }

    async createClient(): Promise<Result<CurseForgeClient>> {
        const client = new CurseForge();
        this.nodecg.log.info("Successfully created CurseForge client.");
        return success(client);
    }

    stopClient(_: CurseForgeClient): void {
        this.nodecg.log.info("Successfully stopped CurseForge client.");
    }
}
