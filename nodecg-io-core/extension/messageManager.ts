import { NodeCG } from "nodecg/types/server";
import { NodeCGIOCore } from "./index";
import { emptySuccess, error, Result } from "./utils/result";

export interface UpdateInstanceConfigMessage {
    instanceName: string,
    config: unknown
}

export interface CreateServiceInstanceMessage {
    serviceType: string,
    instanceName: string
}

export interface DeleteServiceInstanceMessage {
    instanceName: string
}

export interface SetServiceDependencyMessage {
    bundleName: string
    instanceName: string | undefined
    serviceType: string
}

export class MessageManager {
    // TODO: reduce code duplication

    static registerMessageHandlers(nodecg: NodeCG, io: NodeCGIOCore) {
        nodecg.listenFor("updateInstanceConfig", (msg: UpdateInstanceConfigMessage, ack) => {
            const result = io.serviceManager.updateInstanceConfig(msg.instanceName, msg.config);
            if (!ack?.handled) {
                ack?.(result.failed ? result.errorMessage : undefined, undefined);
            }
        });

        nodecg.listenFor("createServiceInstance", (msg: CreateServiceInstanceMessage, ack) => {
            const result = io.serviceManager.createServiceInstance(msg.serviceType, msg.instanceName);
            if (!ack?.handled) {
                ack?.(result.failed ? result.errorMessage : undefined, undefined);
            }
        });

        nodecg.listenFor("deleteServiceInstance", (msg: DeleteServiceInstanceMessage, ack) => {
            const result = io.serviceManager.deleteServiceInstance(msg.instanceName);
            if (!ack?.handled) {
                ack?.(undefined, result);
            }
        });

        nodecg.listenFor("setServiceDependency", (msg: SetServiceDependencyMessage, ack) => {
            let result: Result<void>;
            if (msg.instanceName === undefined) {
                const success = io.bundleManager.unsetServiceDependency(msg.bundleName, msg.serviceType);
                if (success) {
                    result = emptySuccess();
                } else {
                    result = error("Service dependency couldn't be found.");
                }
            } else {
                result = io.bundleManager.setServiceDependency(msg.bundleName, msg.instanceName);
            }

            if (!ack?.handled) {
                ack?.(result.failed ? result.errorMessage : undefined, undefined);
            }
        });
    }
}


