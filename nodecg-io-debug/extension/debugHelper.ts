import { EventEmitter } from "events";
import { NodeCG } from "nodecg/types/server";

export interface Color {
    red: number;
    green: number;
    blue: number;
}

export class DebugHelper extends EventEmitter {
    constructor(nodecg: NodeCG) {
        super();
        nodecg.log.info("DebugHelper is ready to help debugging.");

        // Registering all listeners and defining redirection
        nodecg.listenFor("onClick", (value) => {
            this.emit("onClick");
            this.emit(`onClick${value}`);
        });

        nodecg.listenFor("onNumber", (value) => {
            this.emit("onNumber", parseInt(value));
        });

        for (const range of ["0to100", "0to1", "M1to1"]) {
            nodecg.listenFor(`onRange${range}`, (value) => {
                this.emit(`onRange${range}`, parseFloat(value));
            });
        }

        nodecg.listenFor("onColor", (value) => {
            //nodecg.log.info(`Received message in service: ${value}`);
            this.emit("onColor", DebugHelper.hexToRGB(value));
        });
    }

    private static hexToRGB(hex: string): Color {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                  red: parseInt(result[1], 16),
                  green: parseInt(result[2], 16),
                  blue: parseInt(result[3], 16),
              }
            : { red: 0, green: 0, blue: 0 };
    }

    static createClient(nodecg: NodeCG): DebugHelper {
        return new DebugHelper(nodecg);
    }

    // Custom register handler functions

    onClick(listener: () => void): void {
        this.on("onClick", listener);
    }
    onClick1(listener: () => void): void {
        this.on("onClick1", listener);
    }
    onClick2(listener: () => void): void {
        this.on("onClick2", listener);
    }
    onClick3(listener: () => void): void {
        this.on("onClick3", listener);
    }
    onClick4(listener: () => void): void {
        this.on("onClick4", listener);
    }
    onClick5(listener: () => void): void {
        this.on("onClick5", listener);
    }

    onNumber(listener: (value: number) => void): void {
        this.on("onNumber", listener);
    }

    onRange0to100(listener: (value: number) => void): void {
        this.on("onRange0to100", listener);
    }
    onRange0to1(listener: (value: number) => void): void {
        this.on("onRange0to1", listener);
    }
    onRangeM1to1(listener: (value: number) => void): void {
        this.on("onRangeM1to1", listener);
    }

    onColor(listener: (value: Color) => void): void {
        this.on("onColor", listener);
    }
}
