interface StreamElementsBaseEvent<TType, TData> {
    /**
     * StreamElements hexadecimal Event ID
     */
    _id: string;
    /**
     * StreamElements hexadecimal activity ID
     */
    activityId: string;
    /**
     * StreamElements hexadecimal Channel ID (not your channel name)
     */
    channel: string;
    /**
     * Event creation date and time. E.g. 2021-11-20T19:11:17.472Z
     */
    createdAt: string;
    /**
     * Event update date and time. E.g. 2021-11-20T19:11:17.472Z
     */
    updatedAt: string;
    /**
     * The internal event data.
     */
    data: TData & StreamElementsDataBase;
    flagged?: boolean;
    /**
     * Whether the event was replayed or emulated. Is undefined when the event is a real live event.
     */
    isMock?: boolean;
    /**
     * Event provider
     */
    provider: "twitch" | "youtube" | "facebook";
    /**
     * Event type
     */
    type: TType;
}

interface StreamElementsDataBase {
    /**
     * The url of the user's avatar.
     */
    avatar: string;
    /**
     * The users display name. Never set for mocked events.
     */
    displayName?: string;
    /**
     * The user's Twitch username.
     */
    username: string;
    /**
     * The Twitch Channel ID
     */
    providerId?: string;
}

export type StreamElementsFollowEvent = StreamElementsBaseEvent<"follow", unknown>;

export type StreamElementsCheerEvent = StreamElementsBaseEvent<
    "cheer",
    {
        /**
         * The count of bits that were cheered.
         */
        amount: number;
        /**
         * The message contained in the cheer.
         */
        message: string;
    }
>;

export type StreamElementsHostEvent = StreamElementsBaseEvent<
    "host",
    {
        /**
         * Number of viewers that are watching through this host.
         */
        amount: number;
    }
>;

export type StreamElementsRaidEvent = StreamElementsBaseEvent<
    "raid",
    {
        /**
         * Number of viewers raiding this channel.
         */
        amount: number;
    }
>;

export type StreamElementsSubscriberEvent = StreamElementsBaseEvent<
    "subscriber",
    {
        /**
         * The total amount of months that this user has already subscribed.
         */
        amount: number;
        /**
         * True if this sub was gifted by someone else.
         */
        gifted?: boolean;
        /**
         * True if this sub is part of a subbomb. If not, it is undefined.
         */
        isFromSubBomb?: true;
        /**
         * The username of the user that has gifted this sub.
         */
        sender?: string;
        /**
         * Subscription message by user
         */
        message: string;
        /**
         * Amount of consequent months this user already has subscribed.
         */
        streak: number;
        /**
         * The tier of the subscription.
         */
        tier?: "1000" | "2000" | "3000" | "prime";
    }
>;

export interface StreamElementsSubBombEvent {
    /**
     * The username of the gifter.
     */
    gifterUsername: string;
    /**
     * All gifted subs.
     */
    subscribers: ReadonlyArray<StreamElementsSubscriberEvent>;
}

export type StreamElementsTipEvent = StreamElementsBaseEvent<
    "tip",
    {
        /**
         * The amount of money in the given currency that was tipped.
         */
        amount: number;
        /**
         * The user provided message for this tip.
         */
        message: string;
        /**
         * The currency symbol.
         */
        currency: string;
        /**
         * StreamElements's hexadecimal tip ID.
         */
        tipId: string;
    }
>;

export type StreamElementsEvent =
    | StreamElementsFollowEvent
    | StreamElementsCheerEvent
    | StreamElementsHostEvent
    | StreamElementsRaidEvent
    | StreamElementsSubscriberEvent
    | StreamElementsTipEvent;
