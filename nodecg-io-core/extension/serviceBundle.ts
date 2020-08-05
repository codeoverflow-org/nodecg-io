import { NodeCGIOCore } from ".";
import { NodeCG } from "nodecg/types/server";
import { Service } from "./types";
import { Result } from "./utils/result";

import * as fs from "fs";
import * as path from "path";

/**
 * Class helping to create a nodecg-io service
 *
 * Models a service that a bundle can depend upon and use to access e.g. a twitch chat or similar.
 * @typeParam R a interface type that describes the user provided config for the service.
 *              Intended to hold configurations and authentication information that the service needs to provide a client.
 * @typeParam C the type of a client that the service will provide to bundles using {@link createClient}.
 */
export abstract class ServiceBundle<R, C> implements Service<R, C> {
    public core: NodeCGIOCore | undefined;
    public nodecg: NodeCG;
    public serviceType: string;
    public schema: unknown;

    /**
     * The default value for the config.
     */
    public defaultConfig?: R;

    /**
     * This constructor creates the service and gets the nodecg-io-core
     * @param nodecg the current NodeCG instance
     * @param serviceName the name of the service in all-lowercase-and-with-hyphen
     * @param pathSegments the path to the schema.json most likely __dirname, "../serviceName-schema.json"
     */
    constructor(nodecg: NodeCG, serviceName: string, ...pathSegments: string[]) {
        this.nodecg = nodecg;
        this.serviceType = serviceName;
        this.schema = this.readSchema(pathSegments);

        // Hide nodecg variable from serialization.
        // The service is saved in a Replicant and nodecg tries to serialize everything in there, including
        // nodecg instances, which throw errors when serialized.
        Object.defineProperty(this, "nodecg", { enumerable: false });

        this.nodecg.log.info(this.serviceType + " bundle started.");
        this.core = (this.nodecg.extensions["nodecg-io-core"] as unknown) as NodeCGIOCore | undefined;
        if (this.core === undefined) {
            this.nodecg.log.error(
                "nodecg-io-core isn't loaded! " + this.serviceType + " bundle won't function without it.",
            );
        }
    }

    /**
     * Registers this service bundle at the core bundle, makes it appear in the GUI and makes it usable.
     * @return a service provider for this service, can be used by bundles to depend on this service.
     */
    public register(): void {
        this.core?.registerService(this);
    }

    /**
     * This function validates the passed config after it has been validated against the json schema (if applicable).
     * Should make deeper checks like checking validity of auth tokens.
     * @param config the config which should be validated.
     * @return void if the config passes validation and an error string describing the issue if not.
     */
    abstract async validateConfig(config: R): Promise<Result<void>>;

    /**
     * Creates a client to the service using the validated config.
     * The returned result will be passed to bundles and they should be able to use the service with this returned client.
     *
     * @param config the user provided config for the service.
     * @return the client if everything went well and an error string describing the issue if a error occured.
     */
    abstract async createClient(config: R): Promise<Result<C>>;

    /**
     * Stops a client of this service that is not needed anymore.
     * Services should close any connections that might exist here.
     *
     * @param client the client that needs to be stopped.
     */
    abstract stopClient(client: C): void;

    private readSchema(pathSegments: string[]): unknown {
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
