import fetch from "node-fetch";

export class CurseForge {
    async getAddon(addonId: number): Promise<CurseAddon> {
        return CurseAddon.create(this, addonId);
    }

    async getMultipleAddons(addonIds: number[]): Promise<CurseAddon[]> {
        const addons: CurseAddon[] = [];
        for (const id of addonIds) {
            addons.push(await CurseAddon.create(this, id));
        }

        return addons;
    }

    async searchForAddons(query: CurseSearchQuery): Promise<CurseAddon[]> {
        let params = "";
        if (query.categoryID != undefined) params += `&categoryId=${query.categoryID}`;
        if (query.gameId != undefined) params += `&gameId=${query.gameId}`;
        if (query.gameVersion != undefined) params += `&gameVersion=${query.gameVersion}`;
        if (query.index != undefined) params += `&index=${query.index}`;
        if (query.pageSize != undefined) params += `&pageSize=${query.pageSize}`;
        if (query.searchFilter != undefined) params += `&searchFilter=${query.searchFilter}`;
        if (query.sectionId != undefined) params += `&sectionId=${query.sectionId}`;
        if (query.sort != undefined) params += `&sort=${query.sort}`;
        if (params != "") params = "?" + params.substr(1);
        const response = (await this.rawRequest("GET", `addon/search${params}`)) as unknown[];
        return response.map((x: CurseAddonInfo) => new CurseAddon(this, x.id, x));
    }

    async getAddonDescription(addon: CurseAddon): Promise<string> {
        const response = await fetch(`https://addons-ecs.forgesvc.net/api/v2/addon/${addon.addonId}/description`, {
            method: "GET",
        });

        return response.text();
    }

    async getFileChangelog(file: CurseFileInfo): Promise<string> {
        const respone = await fetch(
            `https://addons-ecs.forgesvc.net/api/v2/addon/${file.projectId}/file/${file.id}/changelog`,
            {
                method: "GET",
            },
        );

        return respone.text();
    }

    async getFeaturedAddons(query: CurseFeaturedAddonsQuery): Promise<CurseFeaturedAddonsResponse> {
        return this.rawRequest("POST", "addon/featured", query);
    }

    async getDatabaseTimestamp(): Promise<Date> {
        const response = await fetch("https://addons-ecs.forgesvc.net/api/v2/addon/timestamp", {
            method: "GET",
        });

        return new Date(await response.text());
    }

    async getAddonByFingerprint(fingerprints: number[]): Promise<CurseFingerprintResponse> {
        return this.rawRequest("POST", "fingerprint", fingerprints);
    }

    async getMinecraftVersionTimestamp(): Promise<Date> {
        const response = await fetch("https://addons-ecs.forgesvc.net/api/v2/minecraft/version/timestamp", {
            method: "GET",
        });

        return new Date(await response.text());
    }

    async getModloaderTimestamp(): Promise<Date> {
        const response = await fetch("https://addons-ecs.forgesvc.net/api/v2/minecraft/modloader/timestamp", {
            method: "GET",
        });

        return new Date(await response.text());
    }

    async getModloaderList(): Promise<CurseModLoader[]> {
        return this.rawRequest("GET", "minecraft/modloader");
    }

    async getCategoryTimestamp(): Promise<Date> {
        const response = await fetch("https://addons-ecs.forgesvc.net/api/v2/category/timestamp", {
            method: "GET",
        });

        return new Date(await response.text());
    }

    async getCategoryInfoList(): Promise<CurseCategoryInfo[]> {
        return this.rawRequest("GET", "https://addons-ecs.forgesvc.net/api/v2/category");
    }

    async getCategoryInfo(categoryId: number): Promise<CurseCategoryInfo> {
        return this.rawRequest("GET", `category/${categoryId}`);
    }

    async getCategorySectionInfo(sectionId: number): Promise<CurseCategoryInfo[]> {
        return this.rawRequest("GET", `category/section/${sectionId}`);
    }

    async getGameTimestamp(): Promise<Date> {
        const response = await fetch("https://addons-ecs.forgesvc.net/api/v2/game/timestamp", {
            method: "GET",
        });

        return new Date(await response.text());
    }

    async getGamesInfoList(supportsAddons?: boolean): Promise<CurseGameInfo[]> {
        let param = "game";
        if (!supportsAddons) param += "?false";

        return this.rawRequest("GET", param);
    }

    async getGameInfo(gameId: number): Promise<CurseGameInfo> {
        return this.rawRequest("GET", `game/${gameId}`);
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    //                                                                                                       //
    //   METHODS FROM HERE ONWARDS UNTIL END OF CLASS CurseForge ARE NOT MEANT TO BE CALLED BY BUNDLES.      //
    //   THEY MAY GIVE MORE POSSIBILITIES BUT YOU CAN ALSO BREAK MUCH WITH IT. CALL THEM AT YOUR OWN RISK.   //
    //                                                                                                       //
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    // eslint-disable-next-line
    async rawRequest(method: HttpMethod, endpoint: string, data?: any): Promise<any> {
        const response = await fetch(`https://addons-ecs.forgesvc.net/api/v2/${endpoint}`, {
            method: method,
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: data == undefined ? undefined : JSON.stringify(data),
        });

        return response.json();
    }
}

export class CurseAddon {
    private readonly curse: CurseForge;
    readonly addonId: number;
    readonly info: CurseAddonInfo;

    constructor(curse: CurseForge, addonId: number, info: CurseAddonInfo) {
        this.curse = curse;
        this.addonId = addonId;
        this.info = info;
    }

    static async create(curse: CurseForge, addonId: number) {
        const response: CurseAddonInfo = await curse.rawRequest("GET", `addon/${addonId}`);
        return new CurseAddon(curse, addonId, response);
    }

    async getFiles(): Promise<CurseFileInfo[]> {
        return this.curse.rawRequest("GET", `addon/${this.addonId}/files`);
    }
}

export class CurseFile {
    private readonly curse: CurseForge;
    readonly addon: CurseAddon;
    readonly fileId: number;
    readonly info: CurseFileInfo;

    constructor(curse: CurseForge, addon: CurseAddon, fileId: number, info: CurseFileInfo) {
        this.curse = curse;
        this.addon = addon;
        this.fileId = fileId;
        this.info = info;
    }

    static async create(curse: CurseForge, addon: CurseAddon, fileId: number) {
        const response: CurseFileInfo = await curse.rawRequest("GET", `addon/${addon.addonId}/file/${fileId}`);
        return new CurseFile(curse, addon, fileId, response);
    }

    getDownloadUrl(): string {
        return this.info.downloadUrl;
    }
}

export type CurseGameInfo = {
    id: number;
    name: string;
    slug: string;
    dateModified: string;
    gameFiles: CurseGameFile[];
    fileParsingRules: CurseParsingRule[];
    categorySections: CurseCategorySection[];
    maxFreeStorage: number;
    maxPremiumStorage: number;
    maxFileSize: number;
    addonSettingsFolderFilter: string | null;
    addonSettingsStartingFolder: string | null;
    addonSettingsFileFilter: string | null;
    addonSettingsFileRemovalFilter: string | null;
    supportsAddons: boolean;
    supportsPartnerAddons: boolean;
    supportedClientConfiguration: number;
    supportsNotifications: boolean;
    profilerAddonId: number;
    twitchGameId: number;
    clientGameSettingsId: number;
};

export type CurseParsingRule = {
    commentStripPattern: string;
    fileExtension: string;
    inclusionPattern: string;
    gameId: number;
    id: number;
};

export type CurseGameFile = {
    id: number;
    gameId: number;
    isRequired: boolean;
    fileName: string;
    fileType: number;
    platformType: number;
};

export type CurseGameDetectionHint = {
    id: number;
    hintType: number;
    hintPath: string;
    hintKey: string | null;
    hintOptions: number;
    gameId: number;
};

export type CurseModLoader = {
    name: string;
    gameVersion: string;
    latest: boolean;
    recommended: boolean;
    dateModified: string;
};

export type CurseAddonInfo = {
    id: number;
    name: string;
    authors: CurseAddonAuthor[];
    attachments: CurseAddonAttachment[];
    websiteUrl: string;
    gameId: number;
    summary: string;
    defaultFileId: number;
    downloadCount: number;
    latestFiles: CurseFileInfo[];
    categories: CurseCategory[];
    status: number;
    primaryCategoryId: number;
    categorySection: CurseCategorySection;
    slug: string;
    gameVersionLatestFiles: CurseGameVersionLatestFile[];
    isFeatured: boolean;
    popularityScore: number;
    gamePopularityRank: number;
    primaryLanguage: string;
    gameSlug: string;
    gameName: string;
    portalName: string;
    dateModified: string;
    dateCreated: string;
    dateReleased: string;
    isAvailable: boolean;
    isExperiemental: boolean;
};

export type CurseAddonAuthor = {
    name: string;
    url: string;
    projectId: number;
    id: number;
    projectTitleId: number | null;
    projectTitleTitle: string | null;
    userId: number;
    twitchId: number;
};

export type CurseAddonAttachment = {
    id: number;
    projectId: number;
    description: string;
    isDefault: boolean;
    thumbnailUrl: string;
    title: string;
    url: string;
    status: number;
};

export type CurseFileInfo = {
    id: number;
    displayName: string;
    fileName: string;
    fileDate: string;
    fileLength: number;
    releaseType: number;
    fileStatus: number;
    downloadUrl: string;
    isAlternate: boolean;
    alternateFileId: number;
    dependencies: CurseDependency[];
    isAvailable: boolean;
    modules: CurseModule[];
    packageFingerprint: number;
    gameVersion: string[];
    sortableGameVersion: CurseSortableGameVersion[];
    installMetadata: unknown;
    changelog: string | null;
    hasInstallScript: boolean;
    isCompatibleWithClient: boolean;
    categorySectionPackageType: number;
    restrictProjectFileAccess: number;
    projectStatus: number;
    renderCacheId: number;
    fileLegacyMappingId: number | null;
    projectId: number;
    parentProjectFileId: number | null;
    parentFileLegacyMappingId: number | null;
    fileTypeId: number | null;
    exposeAsAlternative: unknown;
    packageFingerprintId: number;
    gameVersionDateReleased: string;
    gameVersionMappingId: number;
    gameVersionId: number;
    gameId: number;
    isServerPack: boolean;
    serverPackFileId: number | null;
};

export type CurseGameVersionLatestFile = {
    gameVersion: string;
    projectFileId: number;
    projectFileName: string;
    fileType: number;
};

export type CurseCategory = {
    categoryId: number;
    name: string;
    url: string;
    avatarUrl: string;
    parentId: number;
    rootId: number;
    projectId: number;
    avatarId: number;
    gameId: number;
};

export type CurseCategorySection = {
    id: number;
    gameId: number;
    name: string;
    packageType: number;
    path: string;
    initialInclusionPattern: string;
    extraIncludePattern: unknown;
    gameCategoryId: number;
};

export type CurseCategoryInfo = {
    id: number;
    name: string;
    slug: string;
    avatarUrl: string;
    dateModified: string;
    parentGameCategoryId: number;
    rootGameCategoryId: number;
    gameId: number;
};

export type CurseDependency = {
    addonId: number;
    type: number;
};

export type CurseModule = {
    foldername: string;
    fingerprint: number;
    type: number;
};

export type CurseSortableGameVersion = {
    gameVersionPadded: string;
    gameVersion: string;
    gameVersionReleaseDate: string;
    gameVersionName: string;
};

export type CurseFingerprintResponse = {
    isCacheBuilt: boolean;
    exactMatches: CurseFileInfo[];
    exactFingerprints: number[];
    partialMatches: CurseFileInfo[];
    partialMatchFingerprints: unknown;
    installedFingerprints: number[];
    unmatchedFingerprints: number[];
};

export type CurseFeaturedAddonsResponse = {
    Featured: CurseFileInfo[];
    Popular: CurseFileInfo[];
    RecentlyUpdated: CurseFileInfo[];
};

export type CurseReleaseType = "release" | "beta" | "alpha";

export type CurseDependencyType = "embedded_library" | "optional" | "required" | "tool" | "incompatible" | "include";

export type CurseFileStatus =
    | "status_1"
    | "status_2"
    | "status_3"
    | "approved"
    | "rejected"
    | "status_6"
    | "deleted"
    | "archived";

export type CurseProjectStatus =
    | "new"
    | "status_2"
    | "status_3"
    | "approved"
    | "status_5"
    | "status_6"
    | "status_7"
    | "status_8"
    | "deleted";

export type CurseSearchQuery = {
    categoryID?: number;
    gameId: number;
    gameVersion?: string;
    index?: number;
    pageSize?: number;
    searchFilter?: string;
    sectionId?: number;
    sort?: number;
};

export type CurseFeaturedAddonsQuery = {
    GameId: number;
    addonsIds?: number[];
    featuredCount?: number;
    popularCount?: number;
    updatedCount?: number;
};

export class MagicValues {
    private static readonly RELEASE: Record<CurseReleaseType, number> = {
        alpha: 3,
        beta: 2,
        release: 1,
    };
    private static readonly RELEASE_INVERSE: Record<number, CurseReleaseType> = MagicValues.inverse(
        MagicValues.RELEASE,
    );

    private static readonly DEPENDENCY: Record<CurseDependencyType, number> = {
        include: 6,
        incompatible: 5,
        tool: 4,
        required: 3,
        optional: 2,
        embedded_library: 1,
    };
    private static readonly DEPENDENCY_INVERSE: Record<number, CurseDependencyType> = MagicValues.inverse(
        MagicValues.DEPENDENCY,
    );

    private static readonly FILE_STATUS: Record<CurseFileStatus, number> = {
        archived: 8,
        deleted: 7,
        status_6: 6,
        rejected: 5,
        approved: 4,
        status_3: 3,
        status_2: 2,
        status_1: 1,
    };
    private static readonly FILE_STATUS_INVERSE: Record<number, CurseFileStatus> = MagicValues.inverse(
        MagicValues.FILE_STATUS,
    );

    private static readonly PROJECT_STATUS: Record<CurseProjectStatus, number> = {
        deleted: 9,
        status_8: 8,
        status_7: 7,
        status_6: 6,
        status_5: 5,
        approved: 4,
        status_3: 3,
        status_2: 2,
        new: 1,
    };
    private static readonly PROJECT_STATUS_INVERSE: Record<number, CurseProjectStatus> = MagicValues.inverse(
        MagicValues.PROJECT_STATUS,
    );

    static releaseType(value: number): CurseReleaseType;
    static releaseType(value: CurseReleaseType): number;
    static releaseType(value: never): unknown {
        return MagicValues.mapMagicValue(value, MagicValues.RELEASE, MagicValues.RELEASE_INVERSE);
    }

    static dependencyType(value: number): CurseDependencyType;
    static dependencyType(value: CurseDependencyType): number;
    static dependencyType(value: never): unknown {
        return MagicValues.mapMagicValue(value, MagicValues.DEPENDENCY, MagicValues.DEPENDENCY_INVERSE);
    }

    static fileStatus(value: number): CurseFileStatus;
    static fileStatus(value: CurseFileStatus): number;
    static fileStatus(value: never): unknown {
        return MagicValues.mapMagicValue(value, MagicValues.FILE_STATUS, MagicValues.FILE_STATUS_INVERSE);
    }

    static projectStatus(value: number): CurseProjectStatus;
    static projectStatus(value: CurseProjectStatus): number;
    static projectStatus(value: never): unknown {
        return MagicValues.mapMagicValue(value, MagicValues.PROJECT_STATUS, MagicValues.PROJECT_STATUS_INVERSE);
    }

    private static mapMagicValue(
        value: number | string,
        map: Record<string, number>,
        inverse: Record<number, string>,
    ): number | string {
        if (typeof value == "number") {
            return inverse[value];
        } else {
            return map[value];
        }
    }

    private static inverse<T extends string | number | symbol, U extends string | number | symbol>(
        record: Record<T, U>,
    ): Record<U, T> {
        const inverse: Record<U, T> = {} as Record<U, T>;
        for (const key in record) {
            // noinspection JSUnfilteredForInLoop
            inverse[record[key]] = key;
        }
        return inverse;
    }
}

export type HttpMethod = "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH";
