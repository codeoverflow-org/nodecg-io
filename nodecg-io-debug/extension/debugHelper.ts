import { EventEmitter } from "events";
import { NodeCG } from "nodecg/types/server";

export class DebugHelper extends EventEmitter {
    constructor(nodecg: NodeCG) {
        super();
        nodecg.log.info("DebugHelper is so ready! YEAH.");

        // Testing the communication omegalul
        nodecg.listenFor("printMessage", (value) => {
            nodecg.log.info(`Received message in service: ${value}`);
            this.emit("message", value);
        });
    }

    onMessage(listener: (value: string) => void): void {
        this.on("message", listener);
    }

    static createClient(nodecg: NodeCG): DebugHelper {
        return new DebugHelper(nodecg);
    }
}
