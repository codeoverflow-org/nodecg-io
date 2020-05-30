// Holds generic types for the whole project

import { ReplicantServer } from "nodecg/types/browser";
import { Result } from "./utils/result";

/**
 * Models a service that a bundle can depend upon and use to access e.g. a twitch chat or similar.
 * @typeParam R a interface type that describes the user provided config for the service.
 *              Intended to hold configurations and authentication information that the service needs to provide a client.
 * @typeParam C the type of a client that the service will provide to bundles using {@link createClient}.
 */
export interface Service<R, C> {
    /**
     * User friendly name of the service that should explain the type of service, e.g. "twitch".
     */
    readonly serviceType: string

    /**
     * Path to a json schema of the config. Config will then be validated against this json schema.
     * Ensures that the types of the config are correct and therefore is compatible with the provided config type.
     */
    readonly schemaPath?: string

    /**
     * The default value for the config.
     */
    readonly defaultConfig?: R // TODO: should we rather define defaults in the json schema

    /**
     * This function validates the passed config after it has been validated against the json schema (if applicable).
     * Should make deeper checks like checking validity of auth tokens.
     * @param config the config which should be validated.
     * @return void if the config passes validation and an error string describing the issue if not.
     */
    readonly validateConfig(config: R): Result<void>

    /**
     * Creates a client to the service using the validated config.
     * The returned result will be passed to bundles and they should be able to use the service with this returned client.
     *
     * @param config the user provided config for the service.
     * @return the client if everything went well and an error string describing the issue if a error occured.
     */
    readonly createClient(config: R): Result<C>
}

/**
 * Describes a single instance of a {@link Service} with its own config stored in a replicant.
 * Also holds the last produced client that's used by all bundles which use this service instance.
 */
export interface ServiceInstance<R, C> {
    /**
     * The underlying service of this instance
     */
    readonly service: Service<R, C>

    /**
     * The configuration for the service, provided by the user.
     */
    readonly config: ReplicantServer<R | undefined>

    /**
     * The client that the service generated out of the current config.
     */
    readonly client: ReplicantServer<C | undefined>
}

/**
 * A object which provides access of a service to a bundle.
 * @typeParam C the client object that the underlying service will give to the bundle.
 */
export interface ServiceProvider<C> {
    // TODO: function name is kinda odd, might need renaming
    /**
     * Registers the bundle as a consumer of the service.
     *
     * @param bundleName the name of the bundle that wants to get access to this service.
     * @param clientUpdate the callback that is called once a service client is available or updated.
     *                     The bundle should register handlers to the client here and hold a reference to the client if needed.
     *                     If the bundle already got an client and this is called again, all references to the old client should be dropped.
     *                     The passed client is undefined if there is currently no service instance allocated to this bundle.
     */
    readonly registerBundle(bundleName: string, clientUpdate: (client?: C) => void): void
}

/**
 * A dependency of a bundle on an instance of a service.
 */
export interface ServiceDependency<C> {
    /**
     * The type of the required service. Has to be the same name as the {@link Service.serviceType} of the wanted service.
     */
    readonly serviceType: string

    /**
     * The service instance that currently satisfies the dependency.
     * Set by the user, as they may have multiple service instances with different configs.
     * Undefined if there is currently no instance set to the bundle.
     */
    serviceInstance?: ServiceInstance<unknown, C>

    /**
     * Callback that will give the client of the service to the bundle.
     * Called on initial set of the service instance or if the config of the service instance has changed.
     *
     * @param client the client of the service or undefined if there is currently no service instance set.
     */
    readonly clientUpdateCallback(client?: C): void
}