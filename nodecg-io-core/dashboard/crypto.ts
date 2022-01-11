import {
    PersistentData,
    EncryptedData,
    decryptData,
    deriveEncryptionKey,
    reEncryptData,
} from "nodecg-io-core/extension/persistenceManager";
import { EventEmitter } from "events";
import { ObjectMap, ServiceInstance, ServiceDependency, Service } from "nodecg-io-core/extension/service";
import { isLoaded } from "./authentication";
import { AuthenticationMessage } from "nodecg-io-core/extension/messageManager";
import cryptoJS from "crypto-js";

const encryptedData = nodecg.Replicant<EncryptedData>("encryptedConfig");
let services: Service<unknown, never>[] | undefined;
let encryptionKey: string | undefined;

/**
 * Layer between the actual dashboard and `PersistentData`.
 *
 * a. the naming of `bundleDependencies` in the context of the dashboard is too long, and
 *    I don't want to change the format of the serialized data.
 *
 * b. having everything at hand using one variable is quite nice, so I've added services here to complete it.
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

// Update the decrypted copy of the data once the encrypted version changes (if a encryption key is available).
// This ensures that the decrypted data is always up-to-date.
encryptedData.on("change", updateDecryptedData);

/**
 * Sets the passed password to be used by the crypto module.
 * Uses the password to derive a decryption secret and then tries to decrypt
 * the encrypted data to tell whether the password is correct.
 * If it is wrong the internal encryption key will be set to undefined.
 * Returns whether the password is correct.
 * @param pw the password which should be set.
 */
export async function setPassword(pw: string): Promise<boolean> {
    await Promise.all([
        // Ensures that the `encryptedData` has been declared because it is needed to get the encrypted config.
        // This is especially needed when handling a re-connect as the replicant takes time to declare
        // and the password check is usually faster than that.
        NodeCG.waitForReplicants(encryptedData),
        fetchServices(),
    ]);

    if (encryptedData.value === undefined) {
        encryptedData.value = {};
    }

    const salt = encryptedData.value.salt ?? cryptoJS.lib.WordArray.random(128 / 8).toString();
    // Check if no salt is present, which is the case for the nodecg-io <=0.2 configs
    // where crypto-js derived the encryption key and managed the salt.
    if (encryptedData.value.salt === undefined) {
        // Salt is unset when nodecg-io is first started.

        if (encryptedData.value.cipherText !== undefined) {
            // Salt is unset but we have some encrypted data.
            // This means that this is a old config, that we need to migrate to the new format.

            // Re-encrypt the configuration using our own derived key instead of the password.
            const newEncryptionKey = deriveEncryptionKey(pw, salt);
            const newEncryptionKeyArr = cryptoJS.enc.Hex.parse(newEncryptionKey);
            reEncryptData(encryptedData.value, pw, newEncryptionKeyArr);
        }

        encryptedData.value.salt = salt;
    }

    encryptionKey = deriveEncryptionKey(pw, salt);

    // Load framework, returns false if not already loaded and password/encryption key is wrong
    if ((await loadFramework()) === false) return false;

    if (encryptedData.value) {
        updateDecryptedData(encryptedData.value);
        // encryption key is unset by `updateDecryptedData` if it is wrong.
        // This may happen if the framework was already loaded and `loadFramework` didn't check the password/encryption key.
        if (encryptionKey === undefined) {
            return false;
        }
    }

    return true;
}

export async function sendAuthenticatedMessage<V>(
    messageName: string,
    message: Partial<AuthenticationMessage>,
): Promise<V> {
    if (encryptionKey === undefined) throw "Can't send authenticated message: crypto module not authenticated";
    const msgWithAuth = Object.assign({}, message);
    msgWithAuth.encryptionKey = encryptionKey;
    return await nodecg.sendMessage(messageName, msgWithAuth);
}

/**
 * Returns whether a password derived encryption key has been set in the crypto module aka. whether it is authenticated.
 */
export function isPasswordSet(): boolean {
    return encryptionKey !== undefined;
}

/**
 * Decrypts the passed data using the global encryptionKey variable and saves it into `ConfigData`.
 * Unsets the encryption key if its wrong and also forwards `undefined` to `ConfigData` if the encryption key is unset.
 * @param data the data that should be decrypted.
 */
function updateDecryptedData(data: EncryptedData): void {
    let result: PersistentData | undefined = undefined;
    if (encryptionKey !== undefined && data.cipherText) {
        const passwordWordArray = cryptoJS.enc.Hex.parse(encryptionKey);
        const res = decryptData(data.cipherText, passwordWordArray, data.iv);
        if (!res.failed) {
            result = res.result;
        } else {
            // Secret is wrong
            encryptionKey = undefined;
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
        // services can be treated as constant because once loaded they shouldn't change any more.
        // Therefore, we don't need a handler to rebuild this if services change.
        services,
    };
}

async function fetchServices() {
    services = await nodecg.sendMessage("getServices");
}

async function loadFramework(): Promise<boolean> {
    if (await isLoaded()) return true;

    try {
        await nodecg.sendMessage("load", { encryptionKey });
        return true;
    } catch {
        return false;
    }
}
