import { PersistentData, EncryptedData, decryptData } from "nodecg-io-core/extension/persistenceManager";
import { EventEmitter } from "events";

export const encryptedData = nodecg.Replicant<EncryptedData>("encryptedConfig");
let password: string | undefined;

/**
 * ConfigData and the config variable give other components access to the decrypted data.
 * It can be used to get the raw value or to register a handler.
 */
class ConfigData extends EventEmitter {
    data: PersistentData | undefined;

    constructor() {
        super();
        this.onChange((data) => (this.data = data));
    }

    onChange(handler: (data: PersistentData) => void): void {
        super.on("change", handler);
    }
}
export const config = new ConfigData();

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
    if (password && data.cipherText) {
        const res = decryptData(data.cipherText, password);
        if (!res.failed) {
            result = res.result;
        } else {
            // Password is wrong
            password = undefined;
        }
    }

    config.emit("change", result);
}
