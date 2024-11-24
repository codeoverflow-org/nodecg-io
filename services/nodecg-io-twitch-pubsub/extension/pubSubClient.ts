import { BasicPubSubClient, PubSubClient } from "@twurple/pubsub";
import { createAuthProvider, TwitchServiceConfig } from "nodecg-io-twitch-auth";
import { PubSubClientConfig } from "@twurple/pubsub/lib/PubSubClient";

export class TwitchPubSubServiceClient extends PubSubClient {
    private basicClient: BasicPubSubClient;

    constructor(config: PubSubClientConfig) {
        super(config);

        // Get reference to underlying client.
        // Very ugly but not possible differently.
        // This is a private field and may change but we need it
        // to add listeners for disconnect/connection failures
        // to the underlying basic client and force connection to
        // ensure valid credentials.
        //@ts-expect-error private field
        this.basicClient = this._basicClient;
    }

    /**
     * Creates a instance of TwitchServiceClient using the credentials from the passed config.
     */
    static async createClient(cfg: TwitchServiceConfig): Promise<TwitchPubSubServiceClient> {
        // Create a twitch authentication provider
        const authProvider = await createAuthProvider(cfg);

        // Create the actual pubsub client and connect
        const pubSubClient = new TwitchPubSubServiceClient({ authProvider });

        pubSubClient.basicClient.connect();
        await new Promise((resolve, reject) => {
            pubSubClient.basicClient.onConnect(() => resolve(null));
            // 15 second timeout
            setTimeout(() => reject("Timeout for PubSub connection was exceeded"), 15000);
        });
        return pubSubClient;
    }

    async disconnect(): Promise<void> {
        this.basicClient.disconnect();
        await new Promise((resolve, reject) => {
            this.basicClient.onDisconnect(() => resolve(null));
            // 15 second timeout
            setTimeout(() => reject("Timeout for PubSub disconnection was exceeded"), 15000);
        });
    }
}
