import { ArtNetController } from "artnet-protocol/dist";
import { ArtDmx } from "artnet-protocol/dist/protocol";
import { ArtNetServiceConfig } from "./index";

export class ArtNetServiceClient extends ArtNetController {
    constructor(config: ArtNetServiceConfig) {
        super();
        this.nameShort = "nodecg-io";
        this.nameLong = "https://github.com/codeoverflow-org/nodecg-io";
        this.bind(config.host);
    }

    /**
     * Little simplifiaction to receive `dmx` data.
     */
    onDMX(listener: (packet: ArtDmx) => void): ArtNetServiceClient {
        return this.on("dmx", listener);
    }

    /**
     * Little simplifiaction to send `dmx` data.
     */
    public send(universe: number, data: number[]): void {
        this.sendBroadcastPacket(new ArtDmx(0, 0, universe, data));
    }
}
