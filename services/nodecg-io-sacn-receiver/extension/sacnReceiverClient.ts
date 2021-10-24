import { Packet, Receiver } from "sacn";
import { AssertionError } from "assert";
import { SacnReceiverServiceConfig } from "./index";

export class SacnReceiverServiceClient extends Receiver {
    constructor(config: SacnReceiverServiceConfig) {
        super(config);
    }

    onPacket(listener: (packet: Packet) => void): Receiver {
        return this.on("packet", listener);
    }

    onPacketCorruption(listener: (err: AssertionError) => void): Receiver {
        return this.on("PacketCorruption", listener);
    }

    onPacketOutOfOrder(listener: (err: Error) => void): Receiver {
        return this.on("PacketOutOfOrder", listener);
    }

    onError(listener: (err: Error) => void): Receiver {
        return this.on("error", listener);
    }

    setUniverses(universes: number[]): number[] {
        return (this.universes = universes);
    }
}
