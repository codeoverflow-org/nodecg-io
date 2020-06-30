import { NodeCGIOCore } from ".";
import { NodeCG } from "nodecg/types/server";
import { Service } from "./types";

import * as fs from "fs";
import * as path from "path";

export class serviceBundle {
    private core: NodeCGIOCore | undefined;
    private service: Service<any, any>;

    constructor(nodecg: NodeCG, service: Service<any, any>) {
        this.service = service;
        nodecg.log.info(service.serviceType + " bundle started");
        this.core = (nodecg.extensions["nodecg-io-core"] as unknown) as NodeCGIOCore | undefined;
        if (this.core === undefined) {
            nodecg.log.error(
                "nodecg-io-core isn't loaded! " + service.serviceType + " bundle won't function without it.",
            );
        }
    }

    public register() {
        if (this.core === undefined) {
            return undefined;
        } else {
            return this.core.registerService(this.service);
        }
    }
}

export async function readSchema(nodecg: NodeCG, ...pathSegments: string[]) {
    const joinedPath = path.resolve(...pathSegments);
    try {
        const fileContent = fs.readFileSync(joinedPath, "utf8");
        return JSON.parse(fileContent);
    } catch (err) {
        nodecg.log.error("Couldn't read and parse service schema at " + joinedPath.toString());
        return undefined;
    }
}
