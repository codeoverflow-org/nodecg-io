import { EventEmitter } from "events";
import { NodeCG } from "nodecg-types/types/server";

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
            this.emit("onColor", DebugHelper.hexToRGB(value));
        });

        nodecg.listenFor("onDate", (value) => {
            this.emit("onDate", new Date(value));
        });

        nodecg.listenFor("onBool", (value) => {
            this.emit("onBool", value);
        });

        nodecg.listenFor("onText", (value) => {
            this.emit("onText", value);
        });

        nodecg.listenFor("onList", (value) => {
            const list = (value as string).split(",");
            this.emit("onList", list);
        });

        nodecg.listenFor("onJSON", (value) => {
            this.emit("onJSON", value);
        });
    }

    private static hexToRGB(hex: string): Color {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

        return {
            red: result?.[1] ? parseInt(result[1] ?? "0", 16) : 0,
            green: result?.[2] ? parseInt(result[2] ?? "0", 16) : 0,
            blue: result?.[3] ? parseInt(result[3] ?? "0", 16) : 0,
        };
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

    onDate(listener: (value: Date) => void): void {
        this.on("onDate", listener);
    }

    onBool(listener: (value: boolean) => void): void {
        this.on("onBool", listener);
    }

    onText(listener: (value: string) => void): void {
        this.on("onText", listener);
    }

    onList(listener: (value: Array<string>) => void): void {
        this.on("onList", listener);
    }

    onJSON(listener: (value: unknown) => void): void {
        this.on("onJSON", listener);
    }
}
