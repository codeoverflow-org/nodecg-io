import { ServiceClient } from "nodecg-io-core";
import { Packet, Receiver } from "sacn";
import { AssertionError } from "assert";

export class SacnReceiverServiceClient implements ServiceClient<Receiver> {
    constructor(private sacn: Receiver) {}

    getNativeClient(): Receiver {
        return this.sacn;
    }

    onPacket(listener: (packet: Packet) => void): Receiver {
        return this.sacn.on("packet", listener);
    }

    onPacketCorruption(listener: (err: AssertionError) => void): Receiver {
        return this.sacn.on("PacketCorruption", listener);
    }

    onPacketOutOfOrder(listener: (err: Error) => void): Receiver {
        return this.sacn.on("PacketOutOfOrder", listener);
    }

    onError(listener: (err: Error) => void): Receiver {
        return this.sacn.on("error", listener);
    }

    setUniverses(universes: number[]): number[] {
        return (this.sacn.universes = universes);
    }
}
