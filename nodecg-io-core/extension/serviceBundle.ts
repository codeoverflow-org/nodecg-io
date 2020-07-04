import { NodeCGIOCore } from ".";
import { NodeCG } from "nodecg/types/server";
import { Service, ServiceProvider } from "./types";
import { emptySuccess, Result } from "./utils/result";

import * as fs from "fs";
import * as path from "path";

/**
 * Class helping to create a nodecg-io service
 */
export class ServiceBundle {
    private core: NodeCGIOCore | undefined;
    private service: Service<unknown, unknown>;
    private nodecg: NodeCG;

    constructor(nodecg: NodeCG, serviceName: string, ...pathSegments: string[]) {
        this.nodecg = nodecg;
        this.service = {
            schema: this.readSchema(...pathSegments),
            serviceType: serviceName,
            validateConfig: this.validateConfig,
            createClient: this.createClient(nodecg),
            stopClient: this.stopClient,
        };
        nodecg.log.info(this.service.serviceType + " bundle started");
        this.core = (nodecg.extensions["nodecg-io-core"] as unknown) as NodeCGIOCore | undefined;
        if (this.core === undefined) {
            this.nodecg.log.error(
                "nodecg-io-core isn't loaded! " + this.service.serviceType + " bundle won't function without it.",
            );
        }
    }

    public register(): ServiceProvider<any> | undefined {
        if (this.core === undefined) {
            return undefined;
        } else {
            return this.core.registerService(this.service);
        }
    }

    async validateConfig(config: unknown): Promise<Result<void>> {
        this.nodecg.log.error(
            this.service.serviceType +
                " has not provided a validateConfig method! The service won't function without it.",
        );
        return emptySuccess();
    }

    createClient(nodecg: NodeCG): (config: unknown) => Promise<Result<unknown>> {
        this.nodecg.log.error(
            this.service.serviceType +
                " has not provided a createClient method! The service won't function without it.",
        );
        return async () => {
            return emptySuccess();
        };
    }

    stopClient(config: unknown): void {
        this.nodecg.log.error(this.service.serviceType + " has not provided a stopClient method!");
    }

    private readSchema(...pathSegments: string[]) {
        const joinedPath = path.resolve(...pathSegments);
        try {
            const fileContent = fs.readFileSync(joinedPath, "utf8");
            return JSON.parse(fileContent);
        } catch (err) {
            this.nodecg.log.error("Couldn't read and parse service schema at " + joinedPath.toString());
            return undefined;
        }
    }
}
