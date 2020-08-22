import { NodeCG } from "nodecg/types/server";
import { emptySuccess, error, Result } from "./utils/result";
import { InstanceManager } from "./instanceManager";
import { BundleManager } from "./bundleManager";
import { PersistenceManager } from "./persistenceManager";
import { ServiceManager } from "./serviceManager";

export interface UpdateInstanceConfigMessage {
    instanceName: string;
    config: unknown;
}

export interface CreateServiceInstanceMessage {
    serviceType: string;
    instanceName: string;
}

export interface DeleteServiceInstanceMessage {
    instanceName: string;
}

export interface SetServiceDependencyMessage {
    bundleName: string;
    instanceName: string | undefined;
    serviceType: string;
}

export interface LoadFrameworkMessage {
    password: string;
}

/**
 * Manages communication with the gui and handles NodeCG messages to control the framework.
 * Also adds a small wrapper around the actual functions them to make some things easier.
 */
export class MessageManager {
    static registerMessageHandlers(
        nodecg: NodeCG,
        services: ServiceManager,
        instances: InstanceManager,
        bundles: BundleManager,
        persist: PersistenceManager,
    ): void {
        nodecg.listenFor("updateInstanceConfig", async (msg: UpdateInstanceConfigMessage, ack) => {
            const inst = instances.getServiceInstance(msg.instanceName);
            if (inst === undefined) {
                if (!ack?.handled) {
                    ack?.("Service instance doesn't exist.", undefined);
                }
            } else {
                const result = await instances.updateInstanceConfig(msg.instanceName, msg.config);

                if (!ack?.handled) {
                    ack?.(result.failed ? result.errorMessage : undefined, undefined);
                }
            }
        });

        nodecg.listenFor("createServiceInstance", (msg: CreateServiceInstanceMessage, ack) => {
            const result = instances.createServiceInstance(msg.serviceType, msg.instanceName);
            if (!ack?.handled) {
                ack?.(result.failed ? result.errorMessage : undefined, undefined);
            }
        });

        nodecg.listenFor("deleteServiceInstance", (msg: DeleteServiceInstanceMessage, ack) => {
            const result = instances.deleteServiceInstance(msg.instanceName);
            if (!ack?.handled) {
                ack?.(undefined, result);
            }
        });

        nodecg.listenFor("setServiceDependency", (msg: SetServiceDependencyMessage, ack) => {
            let result: Result<void>;
            if (msg.instanceName === undefined) {
                const success = bundles.unsetServiceDependency(msg.bundleName, msg.serviceType);
                if (success) {
                    result = emptySuccess();
                } else {
                    result = error("Service dependency couldn't be found.");
                }
            } else {
                const instance = instances.getServiceInstance(msg.instanceName);
                if (instance === undefined) {
                    result = error("Service instance couldn't be found.");
                } else {
                    result = bundles.setServiceDependency(msg.bundleName, msg.instanceName, instance);
                }
            }

            if (!ack?.handled) {
                ack?.(result.failed ? result.errorMessage : undefined, undefined);
            }
        });

        nodecg.listenFor("isLoaded", (_msg, ack) => {
            if (!ack?.handled) {
                ack?.(undefined, persist.isLoaded());
            }
        });

        nodecg.listenFor("load", async (msg: LoadFrameworkMessage, ack) => {
            const result = await persist.load(msg.password);
            if (!ack?.handled) {
                ack?.(result.failed ? result.errorMessage : undefined, undefined);
            }
        });

        nodecg.listenFor("getServices", (_msg: undefined, ack) => {
            // We create a shallow copy of the service before we return them because if we return a reference
            // another bundle could call this, get a reference and overwrite the createClient function on it
            // and therefore get a copy of all credentials that are used for services.
            // If we shallow copy the functions get excluded and other bundles can't overwrite it.
            const result = services.getServices().map((svc) => Object.assign({}, svc));

            if (!ack?.handled) {
                ack?.(undefined, result);
            }
        });
    }
}
