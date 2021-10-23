import { BasicPubSubClient, SingleUserPubSubClient } from "twitch-pubsub-client";
import { createAuthProvider, TwitchServiceConfig } from "nodecg-io-twitch-auth";
import { ApiClient } from "twitch";

export class TwitchPubSubServiceClient extends SingleUserPubSubClient {
    private basicClient: BasicPubSubClient;
    constructor(apiClient: ApiClient, basicClient: BasicPubSubClient, private readonly userId: string) {
        super({ twitchClient: apiClient, pubSubClient: basicClient });
        this.basicClient = basicClient;
    }

    /**
     * Creates a instance of TwitchServiceClient using the credentials from the passed config.
     */
    static async createClient(cfg: TwitchServiceConfig): Promise<TwitchPubSubServiceClient> {
        // Create a twitch authentication provider
        const authProvider = await createAuthProvider(cfg);

        // Create the actual pubsub client and connect
        const apiClient = new ApiClient({ authProvider });
        const user = await apiClient.helix.users.getMe();
        const basicClient = new BasicPubSubClient();
        const pubSubClient = new TwitchPubSubServiceClient(apiClient, basicClient, user.id);

        await basicClient.connect();
        return pubSubClient;
    }

    getUserID(): string {
        return this.userId;
    }

    disconnect(): Promise<void> {
        return this.basicClient.disconnect();
    }
}
