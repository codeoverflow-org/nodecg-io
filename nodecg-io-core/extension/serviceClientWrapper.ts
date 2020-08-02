import { EventEmitter } from "events";
import { NodeCGIOCore } from "./index";
import { NodeCG } from "nodecg/types/server";

export class ServiceClientWrapper<C> extends EventEmitter {
    private currentClient: C | undefined;

    constructor() {
        super();
        this.on("update", (client: C | undefined) => {
            this.currentClient = client;
        });
    }

    getClient(): C | undefined {
        return this.currentClient;
    }

    // TODO: add getRawClient function, requires https://github.com/codeoverflow-org/nodecg-io/pull/68

    onAvailable(handler: (client: C) => void): void {
        this.on("update", (client: C | undefined) => {
            if (client !== undefined) {
                handler(client);
            }
        });
    }

    onUnavailable(handler: () => void): void {
        this.on("update", (client: C | undefined) => {
            if (client === undefined) {
                handler();
            }
        });
    }
}

export function requireService<C>(nodecg: NodeCG, serviceType: string): ServiceClientWrapper<C> | undefined {
    const core = (nodecg.extensions["nodecg-io-core"] as unknown) as NodeCGIOCore | undefined;
    if (core === undefined) {
        nodecg.log.error(
            `nodecg-io-core isn't loaded! Can't require ${serviceType} service for bundle ${nodecg.bundleName}.`,
        );
        return;
    }

    return core.requireService(nodecg, serviceType);
}
