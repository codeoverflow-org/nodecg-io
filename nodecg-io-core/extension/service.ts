// Holds types/interfaces related to services

import { Result } from "./utils/result";
import { ServiceProvider } from "./serviceProvider";
import { Logger } from "./utils/logger";

/**
 * Models a map using an object, instead of an iterator like the JavaScript es6 map.
 * Enhances the {@link Record} type of typescript by always considering the case that the value is undefined.
 * This usually happens when the key doesn't exist.
 * Modelling a map using a JavaScript object has the advantage that it can be easily serialized.
 * This is used as this object can be stored in a NodeCG replicant and this replicant can then also be used by the GUI.
 * A normal es6 map would use an iterator which can't be serialized by the NodeCG replicant and thus
 * can't be used to give the GUI access to the data in this map.
 */
export type ObjectMap<V> = Record<string, V>;

/**
 * Models a service that a bundle can depend upon and used to access e.g., a twitch chat or similar.
 * @typeParam R an interface type that describes the user provided config for the service.
 *              Intended to hold configurations and authentication information that the service needs to provide a client.
 * @typeParam C the type of client that the service will provide to bundles using {@link createClient}.
 */
export interface Service<R, C> {
    /**
     * User-friendly name of the service that should explain the type of service, e.g., "twitch".
     */
    readonly serviceType: string;

    /**
     * A JSON schema object of the config. The config will then be validated against this JSON schema.
     * Ensures that the types of the config are correct and therefore is compatible with the provided config type.
     */
    readonly schema?: ObjectMap<unknown>;

    /**
     * The default value for the config.
     */
    readonly defaultConfig?: R;

    /**
     * Config presets that the user can choose to load as their config.
     * Useful for e.g., detected devices with everything already filled in for that specific device.
     * Can also be used to show the user multiple different authentication methods or similar.
     */
    presets?: ObjectMap<R>;

    /**
     * This function validates the passed config after it has been validated against the JSON schema (if applicable).
     * Should make deeper checks like checking validity of auth tokens.
     * @param config the config which should be validated.
     * @param logger the logger which logs with the instance.name as prefix
     * @return void if the config passes validation and an error string describing the issue if not.
     */
    validateConfig(config: R, logger: Logger): Promise<Result<void>>;

    /**
     * Creates a client to the service using the validated config.
     * The returned result will be passed to bundles, and they should be able to use the service with this returned client.
     *
     * @param config the user provided config for the service.
     * @param logger the logger which logs with the instance.name as prefix
     * @return the client if everything went well and an error string describing the issue if an error occurred.
     */
    createClient(config: R, logger: Logger): Promise<Result<C>>;

    /**
     * Stops a client of this service that is not needed any more.
     * Services should close any connections that might exist here.
     *
     * @param client the client that needs to be stopped.
     * @param logger the logger which logs with the instance.name as prefix
     */
    stopClient(client: C, logger: Logger): void;

    /**
     * Removes all handlers from a service client.
     * This is used when a bundle no longer uses a service client it still has its handlers registered.
     * Then this function is called that should remove all handlers
     * and then all bundles that are still using this client will ask to re-register their handlers
     * by running the onAvailable callback of the specific bundle.
     *
     * Can be left unimplemented if the service doesn't have any handlers e.g., a http wrapper
     * @param client the client of which all handlers should be removed
     */
    removeHandlers?(client: C): void;

    /**
     * This flag can be enabled by services if they can't implement {@link removeHandlers} but also have some handlers that
     * should be reset if a bundleDependency has been changed.
     * It gets rid of the handlers by stopping the client and creating a new one, to which then only the
     * now wanted handlers get registered (e.g., if a bundle doesn't use this service any more, but another still does).
     * Not ideal, but if your service can't implement removeHandlers for some reason it is still better than
     * having dangling handlers that still fire even though they shouldn't.
     * @default false
     */
    reCreateClientToRemoveHandlers: boolean;

    /**
     * This flag says that this service cannot be configured and doesn't need any config passed to {@link createClient}.
     * If this is set, {@link validateConfig} will never be called.
     * @default false
     */
    requiresNoConfig: boolean;
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
     * The provider that will provide the service client to the bundle that expressed this service dependency.
     * Will also be used to inform bundle about client updates and unsets.
     */
    readonly provider: ServiceProvider<C>;
}
