import { NodeCG } from "nodecg/types/server";
import { emptySuccess, success, Result } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { Sender, Packet } from "sacn";

interface SacnSenderServiceConfig {
    universe: number;
    port?: number;
    reuseAddr?: boolean;
}

export interface SacnSenderServiceClient {
    getRawClient(): Sender;
    /**
     * Send Payload via sACN
     *
     * The `payload` is an json object following enterys
     *
     * DMX channel (1-512) : percentage value
     */
    sendPayload(payload: Record<number, number>): Promise<void>;
    /**
     * Send a Packet via sACN
     *
     * A `packet` is the low-level implementation of the E1.31 (sACN) protocol.
     * Constructed from either an existing `Buffer` or from `Options`.
     */
    sendPacket(packet: Packet): Promise<void>;
    /**
     * Returns the Universe specified in the GUI
     */
    getUniverse(): number;
}

module.exports = (nodecg: NodeCG) => {
    new SacnSenderService(nodecg, "sacn-sender", __dirname, "../sacn-sender-schema.json").register();
};

class SacnSenderService extends ServiceBundle<SacnSenderServiceConfig, SacnSenderServiceClient> {
    async validateConfig(): Promise<Result<void>> {
        return emptySuccess();
    }

    async createClient(config: SacnSenderServiceConfig): Promise<Result<SacnSenderServiceClient>> {
        const sacn = new Sender(config);

        return success({
            getRawClient() {
                return sacn;
            },
            sendPayload(payload: Record<number, number>): Promise<void> {
                return sacn.send({
                    payload: payload,
                    sourceName: "nodecg-io",
                    priority: 100,
                });
            },
            sendPacket(packet: Packet): Promise<void> {
                return sacn.send(packet);
            },
            getUniverse(): number {
                return sacn.universe;
            },
        });
    }

    stopClient(client: SacnSenderServiceClient): void {
        client.getRawClient().close();
        this.nodecg.log.info("Stopped sACN Sender successfully.");
    }
}
