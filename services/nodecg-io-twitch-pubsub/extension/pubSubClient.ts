import { BasicPubSubClient, SingleUserPubSubClient } from "@twurple/pubsub";
import { createAuthProvider, TwitchServiceConfig } from "nodecg-io-twitch-auth";
import { AuthProvider } from "@twurple/auth";

export class TwitchPubSubServiceClient extends SingleUserPubSubClient {
    private basicClient: BasicPubSubClient;
    constructor(auth: AuthProvider, basicClient: BasicPubSubClient) {
        super({ authProvider: auth, pubSubClient: basicClient });
        this.basicClient = basicClient;
    }

    /**
     * Creates a instance of TwitchServiceClient using the credentials from the passed config.
     */
    static async createClient(cfg: TwitchServiceConfig): Promise<TwitchPubSubServiceClient> {
        // Create a twitch authentication provider
        const authProvider = await createAuthProvider(cfg);

        // Create the actual pubsub client and connect
        const basicClient = new BasicPubSubClient();
        const pubSubClient = new TwitchPubSubServiceClient(authProvider, basicClient);

        await basicClient.connect();
        return pubSubClient;
    }

    disconnect(): Promise<void> {
        return this.basicClient.disconnect();
    }
}
