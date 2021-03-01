import fetch from "node-fetch";

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
        if (channelId == undefined) {
            throw new Error(`Unknown twitch channel: ${channel}`);
        }
        const response = await (await fetch(`https://api.betterttv.net/3/cached/users/twitch/${channelId}`)).json();
        if (response.message == "user not found") {
            // The user has no channel at BTTV (probably never logged in there)
            return undefined;
        } else if (response.message != undefined) {
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
        if (channelId == undefined) {
            throw new Error(`Unknown twitch channel: ${channel}`);
        }
        const response = await (await fetch(`https://api.frankerfacez.com/v1/room/id/${channelId}`)).json();
        if (response.error != undefined) {
            if (response.message == "No such room") {
                // The user has no room at FFZ (probably never logged in there)
                return undefined;
            } else {
                throw new Error(`Failed to get FFZ channel: ${response.message}`);
            }
        }
        return response;
    }

    /**
     * Gets an emote collection for a channel. Here all emotes are stored so you can access all of them
     * without always sending requests to the APIs and caring about undefined values. (If someone is not
     * registered somewhere, there'll just be empty lists here).
     */
    async getEmoteCollection(channel: string, includeGlobal: boolean): Promise<EmoteCollection> {
        const bttv = await this.getBetterTTVChannel(channel);
        const ffz = await this.getFFZChannel(channel);
        const bttvGlobal = includeGlobal ? await this.getBetterTTVGlobalEmotes() : undefined;
        const ffzGlobal = includeGlobal ? await this.getFFZGlobalEmotes() : undefined;
        const ffzGlobalSets: FFZEmoteSet[] = [];
        if (ffzGlobal != undefined) {
            for (const set of ffzGlobal.default_sets) {
                if (set.toString() in ffzGlobal.sets) {
                    ffzGlobalSets.push(ffzGlobal.sets[set.toString()]);
                }
            }
        }
        return {
            bttvChannel: bttv == undefined ? [] : bttv.channelEmotes,
            bttvShared: bttv == undefined ? [] : bttv.sharedEmotes,
            bttvGlobal: bttvGlobal == undefined ? [] : bttvGlobal,
            ffz: ffz == undefined ? [] : Object.values(ffz.sets),
            ffzGlobal: ffzGlobalSets,
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
        for (const emote of emotes.bttvGlobal) {
            emotes_list.add(emote.code);
        }
        for (const set of emotes.ffzGlobal) {
            for (const emote of set.emoticons) {
                emotes_list.add(emote.name);
            }
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
        const bttvResolution = resolution == 4 ? "3" : resolution.toString();
        for (const entry of emotes.bttvChannel) {
            if (entry.code == emote) {
                return `https://cdn.betterttv.net/emote/${entry.id}/${bttvResolution}x.${entry.imageType}`;
            }
        }
        for (const entry of emotes.bttvShared) {
            if (entry.code == emote) {
                return `https://cdn.betterttv.net/emote/${entry.id}/${bttvResolution}x.${entry.imageType}`;
            }
        }
        for (const set of emotes.ffz) {
            for (const entry of set.emoticons) {
                if (entry.name == emote) {
                    const url: FFZUrl | undefined = TwitchAddonsClient.getFFZUrl(entry.urls, resolution);
                    if (url != undefined) {
                        return this.getURL(url);
                    }
                }
            }
        }
        for (const entry of emotes.bttvGlobal) {
            if (entry.code == emote) {
                return `https://cdn.betterttv.net/emote/${entry.id}/${bttvResolution}x.${entry.imageType}`;
            }
        }
        for (const set of emotes.ffzGlobal) {
            for (const entry of set.emoticons) {
                if (entry.name == emote) {
                    const url: FFZUrl | undefined = TwitchAddonsClient.getFFZUrl(entry.urls, resolution);
                    if (url != undefined) {
                        return this.getURL(url);
                    }
                }
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
                    Authorization: `Bearer ${this.token}`,
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

    static createClient(clientId: string, token: string): TwitchAddonsClient {
        return new TwitchAddonsClient(clientId, token);
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
    moderatorBade: string | null;
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
 * Contains a list of emote sets from BTTV and / or FFZ
 */
export type EmoteCollection = {
    bttvChannel: BetterTTVChannelEmote[];
    bttvShared: BetterTTVSharedEmote[];
    bttvGlobal: BetterTTVEmote[];
    ffz: FFZEmoteSet[];
    ffzGlobal: FFZEmoteSet[];
};

/**
 * Resolution of an emote image
 */
export type EmoteResolution = 1 | 2 | 4;
