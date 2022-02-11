import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle, Logger } from "nodecg-io-core";
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
    new CurseforgeService(nodecg, "curseforge").register();
};

class CurseforgeService extends ServiceBundle<never, CurseForgeClient> {
    async validateConfig(): Promise<Result<void>> {
        return emptySuccess();
    }

    async createClient(_: never, logger: Logger): Promise<Result<CurseForgeClient>> {
        const client = new CurseForge();
        logger.info("Successfully created CurseForge client.");
        return success(client);
    }

    stopClient(_: CurseForgeClient, logger: Logger): void {
        logger.info("Successfully stopped CurseForge client.");
    }

    requiresNoConfig = true;
}
