import { PersistentData, EncryptedData, decryptData } from "nodecg-io-core/extension/persistenceManager";
import { EventEmitter } from "events";
import { ObjectMap, ServiceInstance, ServiceDependency, Service } from "nodecg-io-core/extension/service";
import { isLoaded } from "./authentication";
import { PasswordMessage } from "nodecg-io-core/extension/messageManager";

const encryptedData = nodecg.Replicant<EncryptedData>("encryptedConfig");
let services: Service<unknown, never>[] | undefined;
let password: string | undefined;

/**
 * Layer between the actual dashboard and PersistentData.
 * a. the naming of bundleDependencies in the context of the dashboard is too long and
 *    I don't want to change the format of the serialized data.
 * b. having everything at hand using one variable is quite nice so I've added services here to complete it.
 */
interface ConfigData {
    instances: ObjectMap<ServiceInstance<unknown, unknown>>;
    bundles: ObjectMap<ServiceDependency<unknown>[]>;
    services: Service<unknown, never>[];
}

/**
 * Config and the config variable give other components access to the decrypted data.
 * It can be used to get the raw value or to register a handler.
 */
class Config extends EventEmitter {
    data: ConfigData | undefined;

    constructor() {
        super();
        this.onChange((data) => (this.data = data));
    }

    onChange(handler: (data: ConfigData) => void): void {
        super.on("change", handler);
    }
}
export const config = new Config();

// Update the decrypted copy of the data once the encrypted version changes (if pw available).
// This ensures that the decrypted data is kept up-to-date.
encryptedData.on("change", updateDecryptedData);

/**
 * Sets the passed password to be used by the crypto module.
 * Will try to decrypt decrypted data to tell whether the password is correct,
 * if it is wrong the internal password will be set to undefined.
 * Returns whether the password is correct.
 * @param pw the password which should be set.
 */
export async function setPassword(pw: string): Promise<boolean> {
    await Promise.all([
        // Ensures that the encryptedData has been declared because it is needed by setPassword()
        // This is especially needed when handling a reconnect as the replicant takes time to declare
        // and the password check is usually faster than that.
        NodeCG.waitForReplicants(encryptedData),
        fetchServices(),
    ]);

    password = pw;

    // Load framework, returns false if not already loaded and pw is wrong
    if ((await loadFramework()) === false) return false;

    if (encryptedData.value) {
        updateDecryptedData(encryptedData.value);
        // Password is unset by updateDecryptedData if it is wrong.
        // This may happen if the framework was already loaded and loadFramework didn't check the pw.
        if (password === undefined) {
            return false;
        }
    }

    return true;
}

export async function sendAuthenticatedMessage<V>(messageName: string, message: Partial<PasswordMessage>): Promise<V> {
    if (password === undefined) throw "No password available";
    const msgWithAuth = Object.assign({}, message);
    msgWithAuth.password = password;
    return await nodecg.sendMessage(messageName, msgWithAuth);
}

/**
 * Returns whether a password has been set in the crypto module aka. whether is is authenticated.
 */
export function isPasswordSet(): boolean {
    return password !== undefined;
}

/**
 * Decryptes the passed data using the global password variable and saves it into ConfigData.
 * Unsets the password if its wrong and also forwards `undefined` to ConfigData if the password is unset.
 * @param data the data that should be decrypted.
 */
function updateDecryptedData(data: EncryptedData): void {
    let result: PersistentData | undefined = undefined;
    if (password !== undefined && data.cipherText) {
        const res = decryptData(data.cipherText, password);
        if (!res.failed) {
            result = res.result;
        } else {
            // Password is wrong
            password = undefined;
        }
    }

    config.emit("change", persistentData2ConfigData(result));
}

function persistentData2ConfigData(data: PersistentData | undefined): ConfigData | undefined {
    if (!data) return undefined;
    if (!services) {
        nodecg.log.warn("Tried to get config but services were not loaded yet.");
        return undefined;
    }

    return {
        instances: data.instances,
        bundles: data.bundleDependencies,
        // services can be treated as constant because once loaded the shouldn't change anymore.
        // Therefore we don't need a handler to rebuild this if services change.
        services,
    };
}

async function fetchServices() {
    services = await nodecg.sendMessage("getServices");
}

async function loadFramework(): Promise<boolean> {
    if (await isLoaded()) return true;

    try {
        await nodecg.sendMessage("load", { password });
        return true;
    } catch {
        return false;
    }
}
