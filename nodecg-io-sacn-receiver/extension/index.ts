import { NodeCG } from "nodecg/types/server";
import { emptySuccess, success, Result } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { Receiver, Packet } from "sacn";
import { AssertionError } from "assert";

interface SacnReceiverServiceConfig {
    universe: number[];
    port?: number;
    iface?: string;
    reuseAddr?: boolean;
}

export interface SacnReceiverServiceClient {
    getRawClient(): Receiver;
    onPacket(listener: (packet: Packet) => void): Receiver;
    onPacketCorruption(listener: (err: AssertionError) => void): Receiver;
    onPacketOutOfOrder(listener: (err: Error) => void): Receiver;
    onError(listener: (err: Error) => void): Receiver;
    setUniverses(universes: number[]): number[];
}

module.exports = (nodecg: NodeCG) => {
    new SacnReceiverService(nodecg, "sacn-receiver", __dirname, "../sacn-receiver-schema.json").register();
};

class SacnReceiverService extends ServiceBundle<SacnReceiverServiceConfig, SacnReceiverServiceClient> {
    async validateConfig(): Promise<Result<void>> {
        return emptySuccess();
    }

    async createClient(config: SacnReceiverServiceConfig): Promise<Result<SacnReceiverServiceClient>> {
        const sacn = new Receiver(config);

        return success({
            getRawClient() {
                return sacn;
            },
            onPacket(listener: (packet: Packet) => void): Receiver {
                return sacn.on("packet", listener);
            },
            onPacketCorruption(listener: (err: AssertionError) => void): Receiver {
                return sacn.on("PacketCorruption", listener);
            },
            onPacketOutOfOrder(listener: (err: Error) => void): Receiver {
                return sacn.on("PacketOutOfOrder", listener);
            },
            onError(listener: (err: Error) => void): Receiver {
                return sacn.on("error", listener);
            },
            setUniverses(universes: number[]): number[] {
                return (sacn.universes = universes);
            },
        });
    }

    stopClient(client: SacnReceiverServiceClient): void {
        client.getRawClient().close();
        this.nodecg.log.info("Stopped sACN Receiver successfully.");
    }
}
