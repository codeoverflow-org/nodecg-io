import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle, error } from "nodecg-io-core";
import { MqttClient, connect } from "mqtt";

interface MQTTClientServiceConfig {
    address: string;
    topics: [string];
    username?: string;
    password?: string;
}

export class MQTTClientServiceClient {
    client: MqttClient;
    once: (event: string, cb: () => void) => void;
    close: () => void;
    on: (event: string, cb: () => void) => void;
    off: (event: string | symbol, listener: (...args: unknown[]) => void) => void;

    connect(url: string, username: string | undefined, password: string | undefined): Promise<void> {
        return new Promise((resolve, reject) => {
            this.client = connect(url, {
                username: username,
                password: password,
            });
            this.client.on("error", (err: Error) => {
                this.client.end();
                reject(err.message);
            });
            this.client.on("connect", () => {
                resolve();
            });

            this.once = this.client.once;
            this.on = this.client.on;
            this.close = this.client.end;
            this.off = this.client.off;
        });
    }

    subscribe(topics: string[]): void {
        topics.forEach((topic: string) => {
            this.client.subscribe(topic);
        });
    }

    onClose(func: () => void): void {
        this.client.on("close", () => {
            return func();
        });
    }

    onMessage(func: (topic: string, message: Buffer) => void): void {
        this.client.on("message", (topic, message) => {
            return func(topic, message);
        });
    }

    onError(func: (error: Error) => void): void {
        this.client.on("error", (error: Error) => {
            return func(error);
        });
    }
}

module.exports = (nodecg: NodeCG) => {
    new MQTTClientService(nodecg, "mqtt-client", __dirname, "../mqtt-schema.json").register();
};

class MQTTClientService extends ServiceBundle<MQTTClientServiceConfig, MQTTClientServiceClient> {
    async validateConfig(config: MQTTClientServiceConfig): Promise<Result<void>> {
        this.nodecg.log.info("validation");
        const client = new MQTTClientServiceClient();
        try {
            await client.connect(config.address, config.username, config.password);
            return emptySuccess();
        } catch (e) {
            return error(e);
        }
    }

    async createClient(config: MQTTClientServiceConfig): Promise<Result<MQTTClientServiceClient>> {
        const client = new MQTTClientServiceClient();
        await client.connect(config.address, config.username, config.password);
        client.subscribe(config.topics);
        this.nodecg.log.info("Successfully connected to the MQTT server.");
        return success(client);
    }

    stopClient(client: MQTTClientServiceClient): void {
        if (client.client.connected) {
            client.close();
        }
    }

    removeHandlers(client: MQTTClientServiceClient): void {
        client.client.removeAllListeners();
    }
}
