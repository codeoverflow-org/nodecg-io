import fetch from "node-fetch";

export class CurseForge {
    /**
     * Get a curse addon.
     * @param addonId The id of the addon.
     */
    async getAddon(addonId: number): Promise<CurseAddon> {
        return CurseAddon.create(this, addonId);
    }

    /**
     * Get an array of curse addons.
     * @param addonIds An array of ids for multiple addons.
     */
    async getMultipleAddons(addonIds: number[]): Promise<CurseAddon[]> {
        const addons: CurseAddon[] = [];
        for (const id of addonIds) {
            addons.push(await CurseAddon.create(this, id));
        }

        return addons;
    }

    /**
     * Get an array of addons with the search results for the given query.
     * @param query The CurseSearchQuery to use. See documentation of CurseSearchQuery for more info.
     */
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

    /**
     * Get a CurseFeaturedAddonsResponse for the given query. See documentation of CurseFeaturedAddonsResponse for more info.
     * @param query The CurseFeaturedAddonsQuery to use. See documentation of CurseFeaturedAddonsQuery for more info.
     */
    async getFeaturedAddons(query: CurseFeaturedAddonsQuery): Promise<CurseFeaturedAddonsResponse> {
        return this.rawRequest("POST", "addon/featured", query);
    }

    /**
     * Get a CurseFingerprintResponse for given fingerprints. See documentation of CurseFingerprintResponse for more info.
     * @param fingerprints An array of murmurhash2 values of each file without whitespaces.
     */
    async getAddonByFingerprint(fingerprints: number[]): Promise<CurseFingerprintResponse> {
        return this.rawRequest("POST", "fingerprint", fingerprints);
    }

    /**
     * Get an array of all available mod loaders.
     */
    async getModloaderList(): Promise<CurseModLoader[]> {
        return this.rawRequest("GET", "minecraft/modloader");
    }

    /**
     * Get an array of all available curse categories.
     */
    async getCategoryInfoList(): Promise<CurseCategoryInfo[]> {
        return this.rawRequest("GET", "https://addons-ecs.forgesvc.net/api/v2/category");
    }

    /**
     * Get information of a specific category.
     * @param categoryId The id of the category you want information for.
     */
    async getCategoryInfo(categoryId: number): Promise<CurseCategoryInfo> {
        return this.rawRequest("GET", `category/${categoryId}`);
    }

    /**
     * Get information of a specific section.
     * @param sectionId The id of the section you want information for.
     */
    async getCategorySectionInfo(sectionId: number): Promise<CurseCategoryInfo[]> {
        return this.rawRequest("GET", `category/section/${sectionId}`);
    }

    /**
     * Get an array of all games information.
     * @param supportsAddons Optional parameter if only addons are displayed which support addons. Defaults to true.
     */
    async getGamesInfoList(supportsAddons?: boolean): Promise<CurseGameInfo[]> {
        let param = "game";
        if (!supportsAddons) param += "?false";

        return this.rawRequest("GET", param);
    }

    /**
     * Get the game info of a specific game.
     * @param gameId The id of the game you want information for.
     */
    async getGameInfo(gameId: number): Promise<CurseGameInfo> {
        return this.rawRequest("GET", `game/${gameId}`);
    }

    /**
     * Get the UTC time when the database was last updated.
     */
    async getDatabaseTimestamp(): Promise<Date> {
        const response = await fetch("https://addons-ecs.forgesvc.net/api/v2/addon/timestamp", {
            method: "GET",
        });

        return new Date(await response.text());
    }

    /**
     * Get the UTC time when the minecraft versions were last updated.
     */
    async getMinecraftVersionTimestamp(): Promise<Date> {
        const response = await fetch("https://addons-ecs.forgesvc.net/api/v2/minecraft/version/timestamp", {
            method: "GET",
        });

        return new Date(await response.text());
    }

    /**
     * Get the UTC time when the mod loader list was last updated.
     */
    async getModLoaderTimestamp(): Promise<Date> {
        const response = await fetch("https://addons-ecs.forgesvc.net/api/v2/minecraft/modloader/timestamp", {
            method: "GET",
        });

        return new Date(await response.text());
    }

    /**
     * Get the UTC time when the categories were last updated.
     */
    async getCategoryTimestamp(): Promise<Date> {
        const response = await fetch("https://addons-ecs.forgesvc.net/api/v2/category/timestamp", {
            method: "GET",
        });

        return new Date(await response.text());
    }

    /**
     * Get the UTC time when the games were last updated.
     */
    async getGameTimestamp(): Promise<Date> {
        const response = await fetch("https://addons-ecs.forgesvc.net/api/v2/game/timestamp", {
            method: "GET",
        });

        return new Date(await response.text());
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

/**
 * A curse addon such as a Minecraft mod.
 */
export class CurseAddon {
    constructor(private readonly curse: CurseForge, public readonly addonId: number, public readonly info: CurseAddonInfo) {}

    /**
     * Creates an addon.
     * @param curse The CurseForge instance.
     * @param addonId The id of the addon you want to create.
     */
    static async create(curse: CurseForge, addonId: number): Promise<CurseAddon> {
        const response: CurseAddonInfo = await curse.rawRequest("GET", `addon/${addonId}`);
        return new CurseAddon(curse, addonId, response);
    }

    /**
     * Get all files of the addon.
     */
    async getFiles(): Promise<CurseFileInfo[]> {
        return this.curse.rawRequest("GET", `addon/${this.addonId}/files`);
    }

    /**
     * Get the description of an CurseAddon. It's raw html or markdown as a string.
     */
    async getAddonDescription(): Promise<string> {
        const response = await fetch(`https://addons-ecs.forgesvc.net/api/v2/addon/${this.addonId}/description`, {
            method: "GET",
        });

        return response.text();
    }
}

/**
 * A file from an addon.
 */
export class CurseFile {
    readonly addon: CurseAddon;
    readonly fileId: number;
    readonly info: CurseFileInfo;

    constructor(addon: CurseAddon, fileId: number, info: CurseFileInfo) {
        this.addon = addon;
        this.fileId = fileId;
        this.info = info;
    }

    /**
     * Creates a file.
     * @param curse The CurseForge instance.
     * @param addon The parent addon of the file.
     * @param fileId The id of the specific file.
     */
    static async create(curse: CurseForge, addon: CurseAddon, fileId: number): Promise<CurseFile> {
        const response: CurseFileInfo = await curse.rawRequest("GET", `addon/${addon.addonId}/file/${fileId}`);
        return new CurseFile(addon, fileId, response);
    }

    /**
     * Get the download url of the file.
     */
    getDownloadUrl(): string {
        return this.info.downloadUrl;
    }

    /**
     * Get the changelog of a file.
     * It is raw html or markdown as a string.
     */
    async getFileChangelog(): Promise<string> {
        const respone = await fetch(
            `https://addons-ecs.forgesvc.net/api/v2/addon/${this.addon.addonId}/file/${this.fileId}/changelog`,
            {
                method: "GET",
            },
        );

        return respone.text();
    }
}

export type CurseGameInfo = {
    /**
     * The game id
     */
    id: number;
    /**
     * The game name
     */
    name: string;
    /**
     * The slug used in urls
     */
    slug: string;
    /**
     * The date when the game was last modified
     */
    dateModified: string;
    /**
     * The files of the game
     */
    gameFiles: CurseGameFile[];
    fileParsingRules: CurseParsingRule[];
    /**
     * The category sections of a game
     */
    categorySections: CurseCategorySection[];
    maxFreeStorage: number;
    maxPremiumStorage: number;
    maxFileSize: number;
    addonSettingsFolderFilter: string | null;
    addonSettingsStartingFolder: string | null;
    addonSettingsFileFilter: string | null;
    addonSettingsFileRemovalFilter: string | null;
    /**
     * Whether the game supports addons or not
     */
    supportsAddons: boolean;
    supportsPartnerAddons: boolean;
    supportedClientConfiguration: number;
    /**
     * Whether the game supports notifications or not
     */
    supportsNotifications: boolean;
    profilerAddonId: number;
    /**
     * The category id on Twitch of the game
     */
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
    /**
     * The id of a games file
     */
    id: number;
    /**
     * The game id
     */
    gameId: number;
    /**
     * Whether a file is required for the game or not
     */
    isRequired: boolean;
    /**
     * The file name
     */
    fileName: string;
    /**
     * The file type id
     */
    fileType: number;
    /**
     * The platform type id
     */
    platformType: number;
};

export type CurseGameDetectionHint = {
    id: number;
    hintType: number;
    hintPath: string;
    hintKey: string | null;
    hintOptions: number;
    /**
     * The game id
     */
    gameId: number;
};

export type CurseModLoader = {
    /**
     * The loader name
     */
    name: string;
    /**
     * The game version the loader is for
     */
    gameVersion: string;
    /**
     * Whether it's the latest loader version for the game version or not
     */
    latest: boolean;
    /**
     * Whether it's the recommended loader version for the game version or not
     */
    recommended: boolean;
    /**
     * The date when the loader was last modified
     */
    dateModified: string;
};

export type CurseAddonInfo = {
    /**
     * The addon id
     */
    id: number;
    /**
     * The addon name
     */
    name: string;
    /**
     * All users marked as owner or author
     */
    authors: CurseAddonAuthor[];
    /**
     * All attachments such as the logo or screenshots
     */
    attachments: CurseAddonAttachment[];
    /**
     * The url to the addon
     */
    websiteUrl: string;
    /**
     * The game id
     */
    gameId: number;
    /**
     * The small summary shown on overview sites
     */
    summary: string;
    /**
     * The default files id
     */
    defaultFileId: number;
    /**
     * The download count
     */
    downloadCount: number;
    /**
     * The latest release, beta and alpha file
     */
    latestFiles: LatestCurseFileInfo[];
    /**
     * The categories the addon is included in
     */
    categories: CurseCategory[];
    /**
     * The CurseProjectStatus
     */
    status: number;
    /**
     * The primary category id
     */
    primaryCategoryId: number;
    /**
     * The category section the project is included in
     */
    categorySection: CurseCategorySection;
    /**
     * The slug used in urls
     */
    slug: string;
    /**
     * The basic information about latest release, beta and alpha of each game version
     */
    gameVersionLatestFiles: CurseGameVersionLatestFile[];
    isFeatured: boolean;
    /**
     * The value used for sorting by popularity
     */
    popularityScore: number;
    /**
     * The current popularity rank of the game
     */
    gamePopularityRank: number;
    /**
     * The primary language
     */
    primaryLanguage: string;
    /**
     * The games slug used in urls
     */
    gameSlug: string;
    /**
     * The games name
     */
    gameName: string;
    /**
     * The portal you find the addon on
     */
    portalName: string;
    /**
     * The date when the addon was last modified
     */
    dateModified: string;
    /**
     * The date when the addon was created
     */
    dateCreated: string;
    /**
     * The date when the last file was added
     */
    dateReleased: string;
    /**
     * Whether the addon is public visible or not
     */
    isAvailable: boolean;
    /**
     * Whether the addon is in experimental state or not
     */
    isExperiemental: boolean;
};

export type CurseAddonAuthor = {
    /**
     * The authors name
     */
    name: string;
    /**
     * The url to the authors profile
     */
    url: string;
    /**
     * The project id the title data is correct for
     */
    projectId: number;
    id: number;
    /**
     * The id for the authors title in the project
     * null for owner
     */
    projectTitleId: number | null;
    /**
     * The name for the authors title in the project
     * null for owner
     */
    projectTitleTitle: string | null;
    /**
     * The user id
     */
    userId: number;
    /**
     * The twitch id of the users linked twitch account
     */
    twitchId: number;
};

export type CurseAddonAttachment = {
    /**
     * The attachment id
     */
    id: number;
    /**
     * The project id
     */
    projectId: number;
    /**
     * The attachment description
     */
    description: string;
    /**
     * Whether it's the logo or not
     */
    isDefault: boolean;
    /**
     * Thr url to a compressed version
     */
    thumbnailUrl: string;
    /**
     * The attachment name
     */
    title: string;
    /**
     * The url to an uncompressed version
     */
    url: string;
    /**
     * The attachment status
     */
    status: number;
};

export type CurseFileInfo = {
    /**
     * The file id
     */
    id: number;
    /**
     * The displayed name
     */
    displayName: string;
    /**
     * The real file name
     */
    fileName: string;
    /**
     * The date the file was uploaded
     */
    fileDate: string;
    /**
     * The file size in byte
     */
    fileLength: number;
    /**
     * The CurseReleaseType
     */
    releaseType: number;
    /**
     * The CurseFileStatus
     */
    fileStatus: number;
    /**
     * The url where the file can be downloaded
     */
    downloadUrl: string;
    /**
     * Whether it's an additional file or not
     */
    isAlternate: boolean;
    /**
     * The id of the additional file
     */
    alternateFileId: number;
    /**
     * All the dependencies
     */
    dependencies: CurseDependency[];
    /**
     * Whether the file is public visible or not
     */
    isAvailable: boolean;
    /**
     * All the modules of the file
     */
    modules: CurseModule[];
    /**
     * The murmurhash2 fingerprint without whitespaces
     */
    packageFingerprint: number;
    /**
     * The game versions the file is for
     */
    gameVersion: string[];
    installMetadata: unknown;
    /**
     * The file id of the corresponding server pack
     */
    serverPackFileId: number | null;
    /**
     * Whether the file has an install script or not
     */
    hasInstallScript: boolean;
    /**
     * The date the game version was released
     */
    gameVersionDateReleased: string;
    gameVersionFlavor: unknown;
};

export type LatestCurseFileInfo = CurseFileInfo & {
    sortableGameVersion: CurseSortableGameVersion[];
    /**
     * The changelog
     */
    changelog: string | null;
    /**
     * Whether the file is compatible with client or not
     */
    isCompatibleWithClient: boolean;
    categorySectionPackageType: number;
    restrictProjectFileAccess: number;
    /**
     * The CurseProjectStatus
     */
    projectStatus: number;
    renderCacheId: number;
    fileLegacyMappingId: number | null;
    /**
     * The id of the files addon
     */
    projectId: number;
    parentProjectFileId: number | null;
    parentFileLegacyMappingId: number | null;
    fileTypeId: number | null;
    exposeAsAlternative: unknown;
    packageFingerprintId: number;
    gameVersionMappingId: number;
    gameVersionId: number;
    /**
     * The game id
     */
    gameId: number;
    /**
     * Whether this is a server pack or not
     */
    isServerPack: boolean;

    // disable because it's not present in latest file
    gameVersionFlavor: undefined;
};

export type CurseGameVersionLatestFile = {
    /**
     * The game version
     */
    gameVersion: string;
    /**
     * The file id
     */
    projectFileId: number;
    /**
     * The file name
     */
    projectFileName: string;
    /**
     * The file type
     */
    fileType: number;
    gameVersionFlavor: unknown;
};

export type CurseCategory = {
    /**
     * The category id
     */
    categoryId: number;
    /**
     * The category name
     */
    name: string;
    /**
     * The url to the category
     */
    url: string;
    /**
     * The url to the avatar
     */
    avatarUrl: string;
    /**
     * The id to the parent category section
     */
    parentId: number;
    /**
     * The id to the root category section
     */
    rootId: number;
    /**
     * The project id
     */
    projectId: number;
    avatarId: number;
    /**
     * The game id
     */
    gameId: number;
};

export type CurseCategorySection = {
    /**
     * The category section id
     */
    id: number;
    /**
     * The game id the section is for
     */
    gameId: number;
    /**
     * The section name
     */
    name: string;
    packageType: number;
    /**
     * The path where the files should be downloaded to
     */
    path: string;
    initialInclusionPattern: string;
    extraIncludePattern: unknown;
    /**
     * The game category id
     */
    gameCategoryId: number;
};

export type CurseCategoryInfo = {
    /**
     * The category id
     */
    id: number;
    /**
     * The category name
     */
    name: string;
    /**
     * The category slug used in urls
     */
    slug: string;
    /**
     * The url to the avatar
     */
    avatarUrl: string;
    /**
     * The date the category was last updated
     */
    dateModified: string;
    /**
     * The parent game category id
     */
    parentGameCategoryId: number;
    /**
     * The root game category id
     */
    rootGameCategoryId: number;
    /**
     * The game id the category belongs to
     */
    gameId: number;
};

export type CurseDependency = {
    /**
     * The addon id
     */
    addonId: number;
    /**
     * The CurseDependencyType
     */
    type: number;
};

export type CurseModule = {
    /**
     * The folder/file name
     */
    foldername: string;
    /**
     * The folder/file fingerprint
     */
    fingerprint: number;
    /**
     * The folder/file type
     */
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
    /**
     * All exact matches of the given fingerprints
     */
    exactMatches: CurseFileInfo[];
    /**
     * The fingerprints which matched
     */
    exactFingerprints: number[];
    /**
     * All files which matched partially
     */
    partialMatches: CurseFileInfo[];
    /**
     * The fingerprints which matched partially
     */
    partialMatchFingerprints: number[];
    /**
     * All fingerprints you sent
     */
    installedFingerprints: number[];
    /**
     * All fingerprints which didn't match
     */
    unmatchedFingerprints: number[];
};

export type CurseFeaturedAddonsResponse = {
    /**
     * All featured files which matched the query
     */
    Featured: CurseFileInfo[];
    /**
     * All popular files which matched the query
     */
    Popular: CurseFileInfo[];
    /**
     * All recently updated files which matched the query
     */
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
    addonIds?: number[];
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
