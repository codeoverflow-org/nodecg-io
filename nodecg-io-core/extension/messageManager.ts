import { NodeCG } from "nodecg/types/server";
import { emptySuccess, error, Result } from "./utils/result";
import { InstanceManager } from "./instanceManager";
import { BundleManager } from "./bundleManager";
import { PersistenceManager } from "./persistenceManager";
import { ServiceManager } from "./serviceManager";
import { HandledListenForCb } from "nodecg/types/lib/nodecg-instance";

type AckCallback<V> =
    | HandledListenForCb
    | {
          (error: string | undefined, result: V | undefined): void;
          handled: false;
      };

type ListenForCallback<M, V> = (message: M, ack?: AckCallback<V>) => void;

export interface PasswordMessage {
    password: string;
}

export interface UpdateInstanceConfigMessage extends PasswordMessage {
    instanceName: string;
    config: unknown;
}

export interface CreateServiceInstanceMessage extends PasswordMessage {
    serviceType: string;
    instanceName: string;
}

export interface DeleteServiceInstanceMessage extends PasswordMessage {
    instanceName: string;
}

export interface SetServiceDependencyMessage extends PasswordMessage {
    bundleName: string;
    instanceName: string | undefined;
    serviceType: string;
}

/**
 * MessageManager manages communication with the gui and handles NodeCG messages to control the framework.
 * Also adds a small wrapper around the actual functions them to make some things easier.
 */
export class MessageManager {
    constructor(
        private nodecg: NodeCG,
        private services: ServiceManager,
        private instances: InstanceManager,
        private bundles: BundleManager,
        private persist: PersistenceManager,
    ) {}

    registerMessageHandlers(): void {
        this.nodecg.listenFor(
            "updateInstanceConfig",
            this.authRequired(async (msg: UpdateInstanceConfigMessage, ack) => {
                const inst = this.instances.getServiceInstance(msg.instanceName);
                if (inst === undefined) {
                    if (!ack?.handled) {
                        ack?.("Service instance doesn't exist.", undefined);
                    }
                } else {
                    const result = await this.instances.updateInstanceConfig(msg.instanceName, msg.config);

                    if (!ack?.handled) {
                        ack?.(result.failed ? result.errorMessage : undefined, undefined);
                    }
                }
            }),
        );

        this.nodecg.listenFor(
            "createServiceInstance",
            this.authRequired((msg: CreateServiceInstanceMessage, ack) => {
                const result = this.instances.createServiceInstance(msg.serviceType, msg.instanceName);
                if (!ack?.handled) {
                    ack?.(result.failed ? result.errorMessage : undefined, undefined);
                }
            }),
        );

        this.nodecg.listenFor(
            "deleteServiceInstance",
            this.authRequired((msg: DeleteServiceInstanceMessage, ack) => {
                const result = this.instances.deleteServiceInstance(msg.instanceName);
                if (!ack?.handled) {
                    ack?.(undefined, result);
                }
            }),
        );

        this.nodecg.listenFor(
            "setServiceDependency",
            this.authRequired((msg: SetServiceDependencyMessage, ack) => {
                let result: Result<void>;
                if (msg.instanceName === undefined) {
                    const success = this.bundles.unsetServiceDependency(msg.bundleName, msg.serviceType);
                    if (success) {
                        result = emptySuccess();
                    } else {
                        result = error("Service dependency couldn't be found.");
                    }
                } else {
                    const instance = this.instances.getServiceInstance(msg.instanceName);
                    if (instance === undefined) {
                        result = error("Service instance couldn't be found.");
                    } else {
                        result = this.bundles.setServiceDependency(msg.bundleName, msg.instanceName, instance);
                    }
                }

                if (!ack?.handled) {
                    ack?.(result.failed ? result.errorMessage : undefined, undefined);
                }
            }),
        );

        this.nodecg.listenFor("isLoaded", (_msg, ack) => {
            if (!ack?.handled) {
                ack?.(undefined, this.persist.isLoaded());
            }
        });

        this.nodecg.listenFor("load", async (msg: PasswordMessage, ack) => {
            const result = await this.persist.load(msg.password);
            if (!ack?.handled) {
                ack?.(result.failed ? result.errorMessage : undefined, undefined);
            }
        });

        this.nodecg.listenFor("getServices", (_msg: undefined, ack) => {
            // We create a shallow copy of the service before we return them because if we return a reference
            // another bundle could call this, get a reference and overwrite the createClient function on it
            // and therefore get a copy of all credentials that are used for services.
            // If we shallow copy the functions get excluded and other bundles can't overwrite it.
            const result = this.services.getServices().map((svc) => Object.assign({}, svc));

            if (!ack?.handled) {
                ack?.(undefined, result);
            }
        });

        this.nodecg.listenFor("isFirstStartup", (_msg: undefined, ack) => {
            if (!ack?.handled) {
                ack?.(undefined, this.persist.isFirstStartup());
            }
        });
    }

    authRequired<M extends PasswordMessage, V>(handler: ListenForCallback<M, V>): ListenForCallback<M, V> {
        return (message: M, ack: AckCallback<V>) => {
            if (this.persist.checkPassword(message.password)) {
                handler(message, ack);
            } else {
                if (!ack.handled) {
                    ack?.("The password is invalid", undefined);
                }
            }
        };
    }
}
