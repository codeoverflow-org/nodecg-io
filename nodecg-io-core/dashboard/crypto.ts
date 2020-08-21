import { PersistentData, EncryptedData, decryptData } from "nodecg-io-core/extension/persistenceManager";
import { EventEmitter } from "events";
import { ObjectMap, ServiceInstance, ServiceDependency, Service } from "nodecg-io-core/extension/types";

export const encryptedData = nodecg.Replicant<EncryptedData>("encryptedConfig");
const services = nodecg.Replicant<Service<unknown, never>[]>("services");
let password: string | undefined;

/**
 * Layer between the actual dashboard and PersistentData.
 * a. the naming of bundleDependencies in the context of the dashboard is too long and
 *    I don't want to change the format of the serialized data.
 * b. having everything at hand using one variable is quite nice so I've added services here to complete it.
 */
interface ConfigData {
    instances: ObjectMap<string, ServiceInstance<unknown, unknown>>;
    bundles: ObjectMap<string, ServiceDependency<unknown>[]>;
    services: Service<unknown, never>[] | undefined;
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

/**
 * Sets the passed passwort to be used by the crypto module.
 * Will try to decrypt decrypted data to tell whether the password is correct,
 * if it is wrong the internal password will be set to undefined.
 * Returns whether the password is correct.
 * @param pw the password which should be set.
 */
export function setPassword(pw: string): boolean {
    password = pw;

    if (encryptedData.value) {
        updateDecryptedData(encryptedData.value);
        // Password is unset by updateDecryptedData if it is wrong.
        if (!password) {
            return false;
        }
    }
    return true;
}

/**
 * Returns whether a password has been set in the crypto module aka. whether is is authenticated.
 */
export function isPasswordSet(): boolean {
    return password !== undefined;
}

// Update the decrypted copy of the data once the encrypted version changes (if pw available).
// This ensures that the decrypted data is kept uptodate.
encryptedData.on("change", updateDecryptedData);

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
    return {
        instances: data.instances,
        bundles: data.bundleDependencies,
        // services can be treated as constant because once loaded the shouldn't change anymore.
        // Therefore we don't need a handler to rebuild this if services change.
        services: services.value,
    };
}
