import NodeCG from "@nodecg/types";
import { Result, emptySuccess, success, ServiceBundle, Logger } from "nodecg-io-core";
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
            this.client.on("connect", () => resolve());

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

    onClose(func: () => void): MqttClient {
        return this.client.on("close", func);
    }

    onMessage(func: (topic: string, message: Buffer) => void): MqttClient {
        return this.client.on("message", func);
    }

    onError(func: (error: Error) => void): MqttClient {
        return this.client.on("error", func);
    }
}

module.exports = (nodecg: NodeCG.ServerAPI) => {
    new MQTTClientService(nodecg, "mqtt-client", __dirname, "../mqtt-schema.json").register();
};

class MQTTClientService extends ServiceBundle<MQTTClientServiceConfig, MQTTClientServiceClient> {
    async validateConfig(config: MQTTClientServiceConfig): Promise<Result<void>> {
        const client = new MQTTClientServiceClient();

        await client.connect(config.address, config.username, config.password);
        client.close();
        return emptySuccess();
    }

    async createClient(config: MQTTClientServiceConfig, logger: Logger): Promise<Result<MQTTClientServiceClient>> {
        const client = new MQTTClientServiceClient();
        await client.connect(config.address, config.username, config.password);
        client.subscribe(config.topics);
        logger.info("Successfully connected to the MQTT server.");
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
