import NodeCG from "@nodecg/types";
import { emptySuccess, error, Result, success } from "./utils/result";
import { InstanceManager } from "./instanceManager";
import { BundleManager } from "./bundleManager";
import { PersistenceManager } from "./persistenceManager";
import { ServiceManager } from "./serviceManager";

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
 * MessageManager manages communication with the GUI and handles NodeCG messages to control the framework.
 * Also adds a small wrapper around the actual functions them to make some things easier.
 */
export class MessageManager {
    constructor(
        private nodecg: NodeCG.ServerAPI,
        private services: ServiceManager,
        private instances: InstanceManager,
        private bundles: BundleManager,
        private persist: PersistenceManager,
    ) {}

    registerMessageHandlers(): void {
        this.listenWithAuth("updateInstanceConfig", async (msg: UpdateInstanceConfigMessage) => {
            const inst = this.instances.getServiceInstance(msg.instanceName);
            if (inst === undefined) {
                return error("Service instance doesn't exist.");
            } else {
                return await this.instances.updateInstanceConfig(msg.instanceName, msg.config);
            }
        });

        this.listenWithAuth("createServiceInstance", async (msg: CreateServiceInstanceMessage) => {
            return this.instances.createServiceInstance(msg.serviceType, msg.instanceName);
        });

        this.listenWithAuth("deleteServiceInstance", async (msg: DeleteServiceInstanceMessage) => {
            return success(this.instances.deleteServiceInstance(msg.instanceName));
        });

        this.listenWithAuth("setServiceDependency", async (msg: SetServiceDependencyMessage) => {
            if (msg.instanceName === undefined) {
                const success = this.bundles.unsetServiceDependency(msg.bundleName, msg.serviceType);
                if (success) {
                    return emptySuccess();
                } else {
                    return error("Service dependency couldn't be found.");
                }
            } else {
                const instance = this.instances.getServiceInstance(msg.instanceName);
                if (instance === undefined) {
                    return error("Service instance couldn't be found.");
                } else {
                    return this.bundles.setServiceDependency(msg.bundleName, msg.instanceName, instance);
                }
            }
        });

        this.listen("isLoaded", async () => {
            return success(this.persist.isLoaded());
        });

        this.listen("load", async (msg: PasswordMessage) => {
            return this.persist.load(msg.password);
        });

        this.listen("getServices", async () => {
            // We create a shallow copy of the service before we return them because if we return a reference
            // another bundle could call this, get a reference and overwrite the createClient function on it
            // and therefore get a copy of all credentials that are used for services.
            // If we shallow copy the functions get excluded and other bundles can't overwrite it.
            const result = this.services.getServices().map((svc) => Object.assign({}, svc));
            return success(result);
        });

        this.listen("isFirstStartup", async () => {
            return success(this.persist.isFirstStartup());
        });
    }

    private listen<M, V>(messageName: string, cb: (msg: M) => Promise<Result<V>>): void {
        this.nodecg.listenFor(messageName, async (msg: M, ack) => {
            const result = await cb(msg);
            if (!ack?.handled) {
                if (result.failed) {
                    ack?.(result.errorMessage, undefined);
                } else {
                    ack?.(undefined, result.result);
                }
            }
        });
    }

    private listenWithAuth<M extends PasswordMessage, V>(
        messageName: string,
        cb: (msg: M) => Promise<Result<V>>,
    ): void {
        this.listen(messageName, async (msg: M) => {
            if (this.persist.checkPassword(msg.password)) {
                return cb(msg);
            } else {
                return error("The password is invalid");
            }
        });
    }
}
