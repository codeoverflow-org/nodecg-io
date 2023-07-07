/* eslint-disable @typescript-eslint/no-explicit-any */
import NodeCG from "@nodecg/types";

export class Logger {
    constructor(private name: string, private nodecg: NodeCG.ServerAPI) {}
    trace(...args: any[]): void {
        this.nodecg.log.trace(`[${this.name}] ${args[0]}`, ...args.slice(1));
    }

    debug(...args: any[]): void {
        this.nodecg.log.debug(`[${this.name}] ${args[0]}`, ...args.slice(1));
    }

    info(...args: any[]): void {
        this.nodecg.log.info(`[${this.name}] ${args[0]}`, ...args.slice(1));
    }

    warn(...args: any[]): void {
        this.nodecg.log.warn(`[${this.name}] ${args[0]}`, ...args.slice(1));
    }

    error(...args: any[]): void {
        this.nodecg.log.error(`[${this.name}] ${args[0]}`, ...args.slice(1));
    }
}
