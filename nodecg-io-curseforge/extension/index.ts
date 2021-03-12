import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { CurseForge } from "./curseforgeClient";

export type CurseForgeClient = CurseForge;
export {
    CurseAddon,
    CurseFile,
    CurseGameInfo,
    CurseParsingRule,
    CurseGameFile,
    CurseGameDetectionHint,
    CurseModLoader,
    CurseAddonInfo,
    CurseAddonAuthor,
    CurseAddonAttachment,
    CurseFileInfo,
    LatestCurseFileInfo,
    CurseGameVersionLatestFile,
    CurseCategory,
    CurseCategorySection,
    CurseCategoryInfo,
    CurseDependency,
    CurseModule,
    CurseSortableGameVersion,
    CurseFingerprintResponse,
    CurseFeaturedAddonsResponse,
    CurseReleaseType,
    CurseDependencyType,
    CurseFileStatus,
    CurseProjectStatus,
    CurseSearchQuery,
    CurseFeaturedAddonsQuery,
    MagicValues,
    HttpMethod,
} from "./curseforgeClient";

module.exports = (nodecg: NodeCG) => {
    new CurseforgeService(nodecg, "curseforge", __dirname, "../schema.json").register();
};

class CurseforgeService extends ServiceBundle<never, CurseForgeClient> {
    async validateConfig(_: never): Promise<Result<void>> {
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

    requiresNoConfig = true;
}
