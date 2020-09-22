// Holds generic types for the whole project

import { Result } from "./utils/result";

/**
 * Models a map using a object, instead of a iterator like the javascript es6 map.
 * Enhances the {@link Record} type of typescript by always considering the case that the value is undefined.
 * This usually happens when the key doesn't exist.
 * Modeling a map using a javascript object has the advantage that it can be easily serialized.
 * This is used as this object can be stored in a NodeCG Replicant and this Replicant can then also be used by the gui.
 * A normal es6 map would use a iterator which can't be serialized by the NodeCG Replicant and thus
 * can't be used to give the gui access to the data in this map.
 */
export type ObjectMap<K, V> = Record<K, V | undefined>;

/**
 * Models a service that a bundle can depend upon and use to access e.g. a twitch chat or similar.
 * @typeParam R a interface type that describes the user provided config for the service.
 *              Intended to hold configurations and authentication information that the service needs to provide a client.
 * @typeParam C the type of a client that the service will provide to bundles using {@link createClient}.
 */
export interface Service<R, C extends ServiceClient<unknown>> {
    /**
     * User friendly name of the service that should explain the type of service, e.g. "twitch".
     */
    readonly serviceType: string;

    /**
     * A json schema object of the config. The config will then be validated against this json schema.
     * Ensures that the types of the config are correct and therefore is compatible with the provided config type.
     */
    readonly schema?: ObjectMap<unknown>;

    /**
     * The default value for the config.
     */
    readonly defaultConfig?: R;

    /**
     * This function validates the passed config after it has been validated against the json schema (if applicable).
     * Should make deeper checks like checking validity of auth tokens.
     * @param config the config which should be validated.
     * @return void if the config passes validation and an error string describing the issue if not.
     */
    readonly validateConfig(config: R): Promise<Result<void>>;

    /**
     * Creates a client to the service using the validated config.
     * The returned result will be passed to bundles and they should be able to use the service with this returned client.
     *
     * @param config the user provided config for the service.
     * @return the client if everything went well and an error string describing the issue if a error occured.
     */
    readonly createClient(config: R): Promise<Result<C>>;

    /**
     * Stops a client of this service that is not needed anymore.
     * Services should close any connections that might exist here.
     *
     * @param client the client that needs to be stopped.
     */
    readonly stopClient(client: C): void;

    /**
     * Removes all handlers from a service client.
     * This is used when a bundle no longer uses a service client it still has its handlers registered.
     * Then this function is called that should remove all handlers
     * and then all bundles that are still using this client will asked to re-register their handlers
     * by running the onAvailable callback of the specific bundle.
     *
     * Can be left unimplemented if the serivce doesn't has any handlers e.g. a http wrapper
     * @param client the client of which all handlers should be removed
     */
    readonly removeHandlers?(client: C): void;
}

/**
 * Describes a single instance of a {@link Service} with its own config.
 * Also holds the last produced client that's used by all bundles which use this service instance.
 */
export interface ServiceInstance<R, C> {
    /**
     * The underlying name of the service that this instance represents.
     */
    readonly serviceType: string;

    /**
     * The configuration for the service, provided by the user.
     */
    config: R | undefined;

    /**
     * The client that the service generated out of the current config.
     */
    client: C | undefined;
}

/**
 * A dependency of a bundle on an instance of a service.
 */
export interface ServiceDependency<C> {
    /**
     * The type of the required service. Has to be the same name as the {@link Service.serviceType} of the wanted service.
     */
    readonly serviceType: string;

    /**
     * The name of the service instance that currently is set to this dependency.
     * Set by the user, as they may have multiple service instances with different configs.
     * Undefined if there is currently no instance set to the bundle.
     */
    serviceInstance?: string;

    /**
     * Callback that will give the client of the service to the bundle.
     * Called on initial set of the service instance or if the config of the service instance has changed.
     *
     * @param client the client of the service or undefined if there is currently no service instance set.
     */
    readonly clientUpdateCallback(client?: C): void;
}

/**
 * A common interface between all service clients.
 * Currently this only ensures that all services allow access to the underlying client
 * by providing a getNativeClient() function.
 * @typeParam T the type of the underlying client.
 */
export interface ServiceClient<T> {
    getNativeClient(): T;
}
