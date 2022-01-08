import fetch from "node-fetch";
import { getTokenInfo, TwitchServiceConfig, normalizeToken } from "nodecg-io-twitch-auth";

export class TwitchAddonsClient {
    private readonly clientId: string;
    private readonly token: string;

    constructor(clientId: string, token: string) {
        this.clientId = clientId;
        this.token = token;
    }

    /**
     * Gets the global emotes of BetterTTV
     */
    async getBetterTTVGlobalEmotes(): Promise<BetterTTVEmote[]> {
        return await (await fetch("https://api.betterttv.net/3/cached/emotes/global")).json();
    }

    /**
     * Gets the BetterTTV channel data associated with a twitch channel or undefined if that twitch user has
     * not registered for BetterTTV.
     */
    async getBetterTTVChannel(channel: string): Promise<BetterTTVChannel | undefined> {
        const channelId = await this.getUserId(channel);
        if (channelId === undefined) {
            throw new Error(`Unknown twitch channel: ${channel}`);
        }
        const response = await (await fetch(`https://api.betterttv.net/3/cached/users/twitch/${channelId}`)).json();
        if (response.message === "user not found") {
            // The user has no channel at BTTV (probably never logged in there)
            return undefined;
        } else if (response.message !== undefined) {
            throw new Error(`Failed to get BTTV channel: ${response.message}`);
        }
        return response;
    }

    /**
     * Gets the FFZ global emotes
     */
    async getFFZGlobalEmotes(): Promise<FFZGlobalEmotes> {
        return await (await fetch("https://api.frankerfacez.com/v1/set/global")).json();
    }

    /**
     * Gets the FFZ channel data associated with a twitch channel or undefined if that twitch user has
     * not registered for FFZ.
     */
    async getFFZChannel(channel: string): Promise<FFZChannel | undefined> {
        const channelId = await this.getUserId(channel);
        if (channelId === undefined) {
            throw new Error(`Unknown twitch channel: ${channel}`);
        }
        const response = await (await fetch(`https://api.frankerfacez.com/v1/room/id/${channelId}`)).json();
        if (response.error !== undefined) {
            if (response.message === "No such room") {
                // The user has no room at FFZ (probably never logged in there)
                return undefined;
            } else {
                throw new Error(`Failed to get FFZ channel: ${response.message}`);
            }
        }
        return response;
    }

    /**
     * Gets the 7TV global emotes
     */
    async getSevenTVGlobalEmotes(): Promise<SevenTVGlobalEmotes> {
        return await (await fetch("https://api.7tv.app/v2/emotes/global")).json();
    }

    /**
     * Gets the 7tv channel data associated with a twitch channel or undefined if that twitch user has
     * not registered for 7tv.
     */
    async getSevenTVChannel(channel: string): Promise<SevenTVChannelEmotes | undefined> {
        const channelId = await this.getUserId(channel);
        if (channelId === undefined) {
            throw new Error(`Unknown twitch channel: ${channel}`);
        }
        const response = await (await fetch(`https://api.7tv.app/v2/users/${channelId}/emotes`)).json();
        if (response.status === 404) {
            if (response.message.startsWith("Unknown User")) {
                // The user has no room at 7TV (probably never logged in there)
                return undefined;
            } else {
                throw new Error(`Failed to get 7TV channel: ${response.message}`);
            }
        }
        return response;
    }

    /**
     * Gets an emote collection for a channel. Here all emotes are stored so you can access all of them
     * without always sending requests to the APIs and caring about undefined values. (If someone is not
     * registered somewhere, there'll just be empty lists here).
     * @param
     */
    async getEmoteCollection(
        channel: string,
        options: EmoteCollectionOptions = { includeGlobal: true, include7tv: false },
    ): Promise<EmoteCollection> {
        const { includeGlobal = true, include7tv = false } = options;
        const bttv = await this.getBetterTTVChannel(channel);
        const ffz = await this.getFFZChannel(channel);
        const stv = include7tv ? await this.getSevenTVChannel(channel) : undefined;
        const bttvGlobal = includeGlobal ? await this.getBetterTTVGlobalEmotes() : undefined;
        const ffzGlobal = includeGlobal ? await this.getFFZGlobalEmotes() : undefined;
        const stvGlobal = includeGlobal ? await this.getSevenTVGlobalEmotes() : undefined;
        const ffzGlobalSets: FFZEmoteSet[] = [];
        if (ffzGlobal !== undefined) {
            for (const set of ffzGlobal.default_sets) {
                const setObj = ffzGlobal.sets[set.toString()];
                if (setObj !== undefined) {
                    ffzGlobalSets.push(setObj);
                }
            }
        }
        return {
            bttvChannel: bttv === undefined ? [] : bttv.channelEmotes,
            bttvShared: bttv === undefined ? [] : bttv.sharedEmotes,
            bttvGlobal: bttvGlobal === undefined ? [] : bttvGlobal,
            ffz: ffz === undefined ? [] : Object.values(ffz.sets),
            ffzGlobal: ffzGlobalSets,
            stv: stv === undefined ? [] : stv,
            stvGlobal: stvGlobal === undefined ? [] : stvGlobal,
        };
    }

    /**
     * Gets all emote names from an emote collection.
     */
    getEmoteNames(emotes: EmoteCollection): string[] {
        const emotes_list: Set<string> = new Set();
        for (const emote of emotes.bttvChannel) {
            emotes_list.add(emote.code);
        }
        for (const emote of emotes.bttvShared) {
            emotes_list.add(emote.code);
        }
        for (const set of emotes.ffz) {
            for (const emote of set.emoticons) {
                emotes_list.add(emote.name);
            }
        }
        for (const emote of emotes.stv) {
            emotes_list.add(emote.name);
        }
        for (const emote of emotes.bttvGlobal) {
            emotes_list.add(emote.code);
        }
        for (const set of emotes.ffzGlobal) {
            for (const emote of set.emoticons) {
                emotes_list.add(emote.name);
            }
        }
        for (const emote of emotes.stvGlobal) {
            emotes_list.add(emote.name);
        }
        return [...emotes_list];
    }

    /**
     * Gets the emote URL for an emote name from an emote collection. If the requested resolution is
     * not available, you'll get the next available resolution that is smaller than the one you gave.
     * If there's no smaller resolution, you'll get the next bigger one.
     */
    async getEmoteURL(
        emote: string,
        emotes: EmoteCollection,
        resolution: EmoteResolution,
    ): Promise<string | undefined> {
        // BTTV has resolutions 1, 2 and 3, ffz and twitch use 1, 2, and 4
        const bttvResolution = resolution === 4 ? "3" : resolution.toString();
        for (const entry of emotes.bttvChannel) {
            if (entry.code === emote) {
                return `https://cdn.betterttv.net/emote/${entry.id}/${bttvResolution}x.${entry.imageType}`;
            }
        }
        for (const entry of emotes.bttvShared) {
            if (entry.code === emote) {
                return `https://cdn.betterttv.net/emote/${entry.id}/${bttvResolution}x.${entry.imageType}`;
            }
        }
        for (const set of emotes.ffz) {
            for (const entry of set.emoticons) {
                if (entry.name === emote) {
                    const url: FFZUrl | undefined = TwitchAddonsClient.getFFZUrl(entry.urls, resolution);
                    if (url !== undefined) {
                        return this.getURL(url);
                    }
                }
            }
        }
        for (const entry of emotes.stv) {
            if (entry.name === emote) {
                return `https://cdn.7tv.app/emote/${entry.id}/${resolution}x`;
            }
        }
        for (const entry of emotes.bttvGlobal) {
            if (entry.code === emote) {
                return `https://cdn.betterttv.net/emote/${entry.id}/${bttvResolution}x.${entry.imageType}`;
            }
        }
        for (const set of emotes.ffzGlobal) {
            for (const entry of set.emoticons) {
                if (entry.name === emote) {
                    const url: FFZUrl | undefined = TwitchAddonsClient.getFFZUrl(entry.urls, resolution);
                    if (url !== undefined) {
                        return this.getURL(url);
                    }
                }
            }
        }
        for (const entry of emotes.stvGlobal) {
            if (entry.name === emote) {
                return `https://cdn.7tv.app/emote/${entry.id}/${resolution}x`;
            }
        }

        return undefined;
    }

    /**
     * Gets a complete URL from a ffz URL. (This prepends `https:` to the ffz url)
     * @param part
     */
    getURL(part: FFZUrl): string {
        return "https:" + part;
    }

    private async getUserId(channelId: string): Promise<string | undefined> {
        const username = channelId.startsWith("#") ? channelId.substr(1) : channelId;
        const response = await (
            await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
                headers: {
                    "Client-ID": this.clientId,
                    "Authorization": `Bearer ${this.token}`,
                },
            })
        ).json();
        if ((response.data as unknown[]).length > 0) {
            return response.data[0].id;
        } else {
            return undefined;
        }
    }

    private static getFFZUrl(urls: Record<string, FFZUrl>, resolution: EmoteResolution): FFZUrl | undefined {
        for (let i = resolution; i > 0; i--) {
            const resolutionStr = resolution.toString();
            if (resolutionStr in urls) {
                return urls[resolutionStr];
            }
        }
        for (let i = resolution + 1; i <= 4; i++) {
            const resolutionStr = resolution.toString();
            if (resolutionStr in urls) {
                return urls[resolutionStr];
            }
        }
        // Should not happen...
        return undefined;
    }

    static async createClient(config: TwitchServiceConfig): Promise<TwitchAddonsClient> {
        const tokenInfo = await getTokenInfo(config);
        return new TwitchAddonsClient(tokenInfo.clientId, normalizeToken(config));
    }
}

/**
 * The data the better twitch tv API gives for a twitch channel
 */
export type BetterTTVChannel = {
    /**
     * UUID used by BetterTTV for this channel
     */
    id: string;
    /**
     * A list of names of accounts marked as bots in this channel.
     */
    bots: string[];
    /**
     * A list of emotes that were created by this channel's owner and uploaded to BetterTTV
     */
    channelEmotes: BetterTTVChannelEmote[];
    /**
     * A list of emotes that are not uploaded by this channel's owner but are available on this channel.
     */
    sharedEmotes: BetterTTVSharedEmote[];
};

/**
 * One emote from BetterTTV
 */
export type BetterTTVEmote = {
    /**
     * A UUID used to identify this emote
     */
    id: string;
    /**
     * The text in chat that trigger this emote to show up
     */
    code: string;
    /**
     * The type of the image.
     */
    imageType: "png" | "gif";
};

/**
 * One channel emote from BetterTTV
 */
export type BetterTTVChannelEmote = BetterTTVEmote & {
    /**
     * UUID of the user who created this emote. Pretty useless as it seems to be
     * always the same id that is also available in BetterTTVChannel
     */
    userId: string;
};

/**
 * One shared emote from BetterTTV
 */
export type BetterTTVSharedEmote = BetterTTVEmote & {
    /**
     * The user who created this emote
     */
    user: BetterTTVUser;
};

/**
 * A BetterTTV user
 */
export type BetterTTVUser = {
    /**
     * UUID used by BetterTTV for this user
     */
    id: string;
    /**
     * The login name of this user
     */
    name: string;
    /**
     * The display name (name with capitalisation) of this user
     */
    displayName: string;
    /**
     * This seems to be the helix id of the user.
     */
    providerId: string;
};

/**
 * A FFZ URL is always only a part of a URL. Use getURL() to get a complete URL.
 */
export type FFZUrl = string;

/**
 * A channel in the FrankerFaceZ API
 */
export type FFZChannel = {
    /**
     * Generic information about the channel
     */
    room: FFZRoom;
    /**
     * A record containing emote sets. The key of the record is the id of the emote set.
     */
    sets: Record<string, FFZEmoteSet>;
};

/**
 * Generic information abou a FFZ channel.
 */
export type FFZRoom = {
    /**
     * The helix id of the user
     */
    twitch_id: number;
    /**
     * The login name of the user
     */
    id: string;
    /**
     * I can not really say what this is and it seems to be false in most cases.
     */
    is_group: boolean;
    /**
     * The display name (name with capitalisation) of the user
     */
    display_name: string;
    /**
     * The custom moderator badge url.
     */
    moderatorBadge: string | null;
    // If anyone can tell what the next four are, please extend the type definition.
    // They were always null or empty for the channels I tested it with
    mod_urls: unknown;
    user_badges: Record<string, unknown>;
    user_badge_ids: Record<string, unknown>;
    css: unknown;
};

/**
 * A set of FFZ emotes
 */
export type FFZEmoteSet = {
    /**
     * The id of the emote set.
     */
    id: number;
    /**
     * The title of the emote set.
     */
    title: string;
    // If anyone can tell what the next two are, please extend the type definition.
    // They were always null or empty for the channels I tested it with
    icon: unknown;
    css: unknown;
    emoticons: FFZEmote[];
};

/**
 * One FFZ emote
 */
export type FFZEmote = {
    /**
     * The id of the emote
     */
    id: number;
    /**
     * The code used in chat to display this emote
     */
    name: string;
    // Whatever this means. There are different resolutions anyways.
    width: number;
    height: number;
    public: boolean;
    offset: unknown;
    margins: unknown;
    css: unknown;
    owner: FFZUser;
    status: number;
    usage_count: number;
    // The next two are date strings
    created_at: string;
    last_updated: string;
    /**
     * URLS of the emote. The key is the resolution, which is always a number string.
     */
    urls: Record<string, FFZUrl>;
};

/**
 * A FFZ user
 */
export type FFZUser = {
    /**
     * The login name of the user
     */
    name: string;
    /**
     * The display name (name with capitalisation) of the user
     */
    display_name: string;
};

/**
 * Global emotes from FFZ
 */
export type FFZGlobalEmotes = {
    /**
     * Contains the ids of sets that everyone can use.
     */
    default_sets: number[];
    /**
     * The global emote sets. The key of the record is the id of the emote set.
     */
    sets: Record<string, FFZEmoteSet>;
};

/**
 * A badge object in 7TV. Contains image URLs and a list of all users who have the badge.
 *
 * The list of users depends on the query:
 * > `user_identifier: "object_id" | "twitch_id" | "login"`
 */
export type SevenTVBadge = {
    /**
     * 7TV Badge ID
     */
    id: string;
    /**
     * 7TV Badge Name
     * @example "Admin"
     */
    name: string;
    /**
     * 7TV Tooltip in case of Rendering for UI
     * @example "7TV Admin"
     */
    tooltip: string;
    /**
     * 7TV Badge URLs to grab the image url.
     * Url will always be at index [2].
     * @example [["1", "https://cdn.7tv.app/badge/60cd6255a4531e54f76d4bd4/1x", ""], ...]
     */
    urls: [string, string, string][];
    /**
     * A list of all userIds. The format of the IDs are determined by the query sent to obtain the data.
     *
     * @example
     * ```
     * // user_identifier = "twitch_id" (Twitch User ID)
     * ["24377667", "12345678", ...]
     * ```
     * @example
     * ```
     * //user_identifier = "login" (Twitch Usernames)
     * ["anatoleam", "mizkif", "devjimmyboy", ...]
     * ```
     * @example
     * ```
     * // user_identifier = "object_id" (7tv User ID)
     * ["60c5600515668c9de42e6d69", "3bc5437b814a67920f3dde4b", ...]
     * ```
     */
    users: string[];
};

/**
 * 7TV Emote Object
 */
export type SevenTVEmote = {
    /**
     * Unique ID of 7TV Emote.
     */
    id: string;
    /**
     * Name of emote. What users type to display an emote.
     * @example "FeelsDankMan"
     */
    name: string;
    /**
     * Owner of the emote.
     */
    owner: SevenTVUser;
    /**
     * Number corresponding to the global visibility
     */
    visibility: number;
    /**
     * API Docs don't say what this is,
     * most likely a list of strings corresponding to `visibility` property.
     */
    visibility_simple: unknown[];
    /**
     * MIME Type of Emote Asset.
     * Most are served as `image/gif` or `image/png`
     * @example "image/webp"
     */
    mime: string;
    /**
     * Status of emote.
     * Whether emote is approved or not by 7TV Moderators.
     * @example 3
     */
    status: number;
    /**
     * Docs don't say the type of this. I'd guess it's a creator-defined list of strings used for search purposes.
     * @example []
     */
    tags: unknown[];
    /**
     * List of widths with length/index corresponding to urls in #urls.
     * @example [27,41,65,110]
     */
    width: number[];
    /**
     * List of heights with length/index corresponding to urls in #urls.
     * @example [32,48,76,128]
     */
    height: number[];
    /**
     * List of tuples with type `[${Resolution}, ${URL of Emote}]`
     */
    urls: [string, string][];
};
/**
 * List of emotes for a specified Channel
 */
export type SevenTVChannelEmotes = SevenTVEmote[];
/**
 * List of Global Emotes for 7TV.
 */
export type SevenTVGlobalEmotes = SevenTVEmote[];

/**
 * 7TV User Object.
 */
export type SevenTVUser = {
    /**
     * ID of the User in 7TV API.
     */
    id: string;
    /**
     * Twitch ID of the User.
     */
    twitch_id: string;
    /**
     * Twitch Login of the User.
     */
    login: string;
    /**
     * Twitch Display Name of the User.
     */
    display_name: string;
    /**
     * 7TV object describing permissions for this user.
     */
    role: {
        /**
         * Role ID
         */
        id: string;
        /**
         * Role Name.
         */
        name: string;
        /**
         * Position in Role's Userlist
         */
        position: number;
        /**
         * Color of Role.
         */
        color: number;
        /**
         * Number that describes allowed perms of User.
         */
        allowed: number;
        /**
         * Number that describes denied perms of User.
         */
        denied: number;
    };
};

/**
 * Contains a list of emote sets from BTTV and / or FFZ
 */
export type EmoteCollection = {
    bttvChannel: BetterTTVChannelEmote[];
    bttvShared: BetterTTVSharedEmote[];
    bttvGlobal: BetterTTVEmote[];
    ffz: FFZEmoteSet[];
    ffzGlobal: FFZEmoteSet[];
    stv: SevenTVChannelEmotes;
    stvGlobal: SevenTVGlobalEmotes;
};

/**
 * Options for method getEmoteCollection.
 */
export type EmoteCollectionOptions = {
    /**
     * Include each providers' global emotes in the returned collection.
     * @default true
     */
    includeGlobal?: boolean;
    /**
     * Include [7TV](https://7tv.app) emotes in the returned collection.
     * @default false
     */
    include7tv?: boolean;
};

/**
 * Resolution of an emote image
 */
export type EmoteResolution = 1 | 2 | 3 | 4;
