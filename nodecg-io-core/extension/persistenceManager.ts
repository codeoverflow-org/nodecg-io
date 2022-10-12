import { NodeCG, ReplicantServer } from "nodecg-types/types/server";
import { InstanceManager } from "./instanceManager";
import { BundleManager } from "./bundleManager";
import crypto from "crypto-js";
import { argon2id } from "hash-wasm";
import { emptySuccess, error, Result, success } from "./utils/result";
import { ObjectMap, ServiceDependency, ServiceInstance } from "./service";
import { ServiceManager } from "./serviceManager";

/**
 * Models all the data that needs to be persistent in a plain manner.
 */
export interface PersistentData {
    /**
     * All instance data that is held by the {@link InstanceManager}.
     */
    instances: ObjectMap<ServiceInstance<unknown, unknown>>;
    /**
     * All bundle dependency data that is held by the {@link BundleManager}.
     */
    bundleDependencies: ObjectMap<ServiceDependency<unknown>[]>;
}

/**
 * Models all the data that needs to be persistent in an encrypted manner.
 *
 * For nodecg-io <= 0.2 configurations only the ciphertext value may be set
 * containing the encrypted data, iv and salt in the crypto.js format.
 * Salt and iv are managed by crypto.js and all AES defaults with a password are used (PBKDF1 using 1 MD5 iteration).
 * All this happens in the nodecg-io-core extension and the password is sent using NodeCG Messages.
 *
 * For nodecg-io >= 0.3 this was changed. A encryption key is derived using argon2id directly inside the browser when logging in.
 * Only the derived AES encryption key is sent to the extension using NodeCG messages.
 * That way analyzed network traffic and malicious bundles that listen for the same NodeCG message only allow getting
 * the encryption key and not the plain text password that may be used somewhere else.
 *
 * Still with this security upgrade you should only use trusted bundles with your NodeCG installation
 * and use https if you're using the dashboard over a untrusted network.
 *
 */
export interface EncryptedData {
    /**
     * The encrypted format of the data that needs to be stored.
     */
    cipherText?: string;

    /**
     * The salt that is used when deriving the encryption key from the password.
     * Only set for new format with nodecg-io >=0.3.
     */
    salt?: string;

    /**
     * The initialization vector used for encryption.
     * Only set for new format with nodecg-io >=0.3.
     */
    iv?: string;
}

/**
 * Decrypts the passed encrypted data using the passed encryption key.
 * If the encryption key is wrong, an error will be returned.
 *
 * This function supports the <=0.2 format with the plain password as an
 * encryption key and no iv (read from ciphertext) and the >=0.3 format with the iv and derived key.
 *
 * @param cipherText the ciphertext that needs to be decrypted.
 * @param encryptionKey the encryption key for the encrypted data.
 * @param iv the initialization vector for the encrypted data.
 */
export function decryptData(
    cipherText: string,
    encryptionKey: string | crypto.lib.WordArray,
    iv: string | undefined,
): Result<PersistentData> {
    try {
        const ivWordArray = iv ? crypto.enc.Hex.parse(iv) : undefined;
        const decryptedBytes = crypto.AES.decrypt(cipherText, encryptionKey, { iv: ivWordArray });
        const decryptedText = decryptedBytes.toString(crypto.enc.Utf8);
        const data: PersistentData = JSON.parse(decryptedText);
        return success(data);
    } catch {
        return error("Password isn't correct.");
    }
}

/**
 * Encrypts the passed data object using the passed encryption key.
 *
 * @param data the data that needs to be encrypted.
 * @param encryptionKey the encryption key that should be used to encrypt the data.
 * @returns a tuple containing the encrypted data and the initialization vector as a hex string.
 */
export function encryptData(data: PersistentData, encryptionKey: crypto.lib.WordArray): [string, string] {
    const iv = crypto.lib.WordArray.random(16);
    const ivText = iv.toString();
    const encrypted = crypto.AES.encrypt(JSON.stringify(data), encryptionKey, { iv });
    return [encrypted.toString(), ivText];
}

/**
 * Derives a key suitable for encrypting the config from the given password.
 *
 * @param password the password from which the encryption key will be derived.
 * @param salt the hex encoded salt that is used for key derivation.
 * @returns a hex encoded string of the derived key.
 */
export async function deriveEncryptionKey(password: string, salt: string): Promise<string> {
    const saltBytes = Uint8Array.from(salt.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? []);

    return await argon2id({
        password,
        salt: saltBytes,
        // OWASP reccomends either t=1,m=37MiB or t=2,m=37MiB for argon2id:
        // https://www.owasp.org/index.php/Password_Storage_Cheat_Sheet#Argon2id
        // On a Ryzen 5 5500u a single iteration is about 220 ms. Two iterations would make that about 440 ms, which is still fine.
        // This is run inside the browser when logging in, therefore 37 MiB is acceptable too.
        // To future proof this we use 37 MiB ram and 2 iterations.
        iterations: 2,
        memorySize: 37, // KiB
        hashLength: 32, // Output size: 32 bytes = 256 bits as a key for AES-256
        parallelism: 1,
        outputType: "hex",
    });
}

/**
 * Re-encrypts the passed data to change the password/encryption key.
 * Currently only used to migrate from <=0.2 to >=0.3 config formats but
 * could be used to implement a change password feature in the future.
 * @param data the data that should be re-encrypted.
 * @param oldSecret the previous encryption key or password.
 * @param newSecret the new encryption key.
 */
export function reEncryptData(
    data: EncryptedData,
    oldSecret: string | crypto.lib.WordArray,
    newSecret: crypto.lib.WordArray,
): Result<void> {
    if (data.cipherText === undefined) {
        return error("Cannot re-encrypt empty cipher text.");
    }

    const decryptedData = decryptData(data.cipherText, oldSecret, data.iv);
    if (decryptedData.failed) {
        return error(decryptedData.errorMessage);
    }

    const [newCipherText, iv] = encryptData(decryptedData.result, newSecret);
    data.cipherText = newCipherText;
    data.iv = iv;
    return emptySuccess();
}

/**
 * Ensures that the passed encrypted data has the salt attribute set.
 * The salt attribute is not set when either this is the first start of nodecg-io
 * or if this is a old config from nodecg-io <= 0.2.
 *
 * If this is a new configuration a new salt will be generated, set inside the EncryptedData object and returned.
 * If this is a old configuration from nodecg-io <= 0.2 it will be migrated to the new format as well.
 *
 * @param data the encrypted data where the salt should be ensured to be available
 * @param password the password of the encrypted data. Used if this config needs to be migrated
 * @return returns the either retrieved or generated salt
 */
export async function getEncryptionSalt(data: EncryptedData, password: string): Promise<string> {
    if (data.salt !== undefined) {
        // We already have a salt, so we have the new (nodecg-io >=0.3) format too.
        // We don't need to do anything then.
        return data.salt;
    }

    // No salt is present, which is the case for the nodecg-io <=0.2 configs
    // where crypto-js derived the encryption key and managed the salt
    // or when nodecg-io is first started.

    // Generate a random salt.
    const salt = crypto.lib.WordArray.random(128 / 8).toString();

    if (data.cipherText !== undefined) {
        // Salt is unset but we have some encrypted data.
        // This means that this is a old config (nodecg-io <=0.2), that we need to migrate to the new format.

        // Re-encrypt the configuration using our own derived key instead of the password.
        const newEncryptionKey = await deriveEncryptionKey(password, salt);
        const newEncryptionKeyArr = crypto.enc.Hex.parse(newEncryptionKey);
        const res = reEncryptData(data, password, newEncryptionKeyArr);
        if (res.failed) {
            throw new Error(`Failed to migrate config: ${res.errorMessage}`);
        }
    }

    data.salt = salt;
    return salt;
}

/**
 * Manages encrypted persistence of data that is held by the instance and bundle managers.
 */
export class PersistenceManager {
    private encryptionKey: string | undefined;
    // We store the encrypted data in a replicant, because writing files in a NodeCG bundle isn't very clean
    // and the bundle config is read-only. It is only in encrypted form, so it is OK to be accessible in the browser.
    private encryptedData: ReplicantServer<EncryptedData>;

    constructor(
        private readonly nodecg: NodeCG,
        private readonly services: ServiceManager,
        private readonly instances: InstanceManager,
        private readonly bundles: BundleManager,
    ) {
        this.encryptedData = nodecg.Replicant("encryptedConfig", {
            persistent: true, // Is ok since it is encrypted
            defaultValue: {},
        });
        this.checkAutomaticLogin();
    }

    /**
     * Checks whether the passed encryption key is correct. Only works if already loaded and a encryption key is already set.
     * @param encryptionKey the encryption key which should be checked for correctness
     */
    checkEncryptionKey(encryptionKey: string): boolean {
        if (this.isLoaded()) {
            return this.encryptionKey === encryptionKey;
        } else {
            return false;
        }
    }

    /**
     * Returns if the locally stored configuration has been loaded and a encryption key has been set.
     */
    isLoaded(): boolean {
        return this.encryptionKey !== undefined;
    }

    /**
     * Returns whether this is the first startup aka. whether any encrypted data has been saved.
     * If this returns true {@link load} will accept any encryption key and use it to encrypt the configuration.
     */
    isFirstStartup(): boolean {
        return this.encryptedData.value.cipherText === undefined;
    }

    /**
     * Decrypts and loads the locally stored configuration using the passed encryption key.
     * @param encryptionKey the encryption key of the encrypted config.
     * @return success if the encryption key was correct and loading has been successful and an error if the encryption key is wrong.
     */
    async load(encryptionKey: string): Promise<Result<void>> {
        if (this.isLoaded()) {
            return error("Config has already been decrypted and loaded.");
        }

        if (this.encryptedData.value.cipherText === undefined) {
            // No encrypted data has been saved, probably because this is the first startup.
            // Therefore nothing needs to be decrypted, and we write an empty config to disk.
            this.nodecg.log.info("No saved configuration found, creating a empty one.");
            this.encryptionKey = encryptionKey;
            this.save();
        } else {
            // Decrypt config
            this.nodecg.log.info("Decrypting and loading saved configuration.");
            const encryptionKeyArr = crypto.enc.Hex.parse(encryptionKey);
            const data = decryptData(
                this.encryptedData.value.cipherText,
                encryptionKeyArr,
                this.encryptedData.value.iv,
            );
            if (data.failed) {
                this.nodecg.log.error("Could not decrypt configuration: encryption key is invalid.");
                return data;
            }

            // Load config into the respecting manager
            // Instances first as the bundle dependency depend upon the existing instances.
            const promises = this.loadServiceInstances(data.result.instances);
            this.loadBundleDependencies(data.result.bundleDependencies);
            this.saveAfterServiceInstancesLoaded(promises);
        }

        // Save encryption key, used in save() function
        this.encryptionKey = encryptionKey;

        // Register handlers to save when something changes
        this.instances.on("change", () => this.save());
        this.bundles.on("change", () => this.save());

        return emptySuccess();
    }

    /**
     * Loads all passed instances into the framework by creating instances of the same type and name
     * and then setting the config of the passed object.
     * @param instances the service instances that should be loaded.
     */
    private loadServiceInstances(instances: ObjectMap<ServiceInstance<unknown, unknown>>): Promise<void>[] {
        return Object.entries(instances).map(([instanceName, instance]) => {
            // Re-create service instance.
            const result = this.instances.createServiceInstance(instance.serviceType, instanceName);
            if (result.failed) {
                this.nodecg.log.warn(
                    `Couldn't load instance "${instanceName}" from saved configuration: ${result.errorMessage}`,
                );
                return Promise.resolve();
            }

            const svc = this.services.getService(instance.serviceType);
            if (!svc.failed && svc.result.requiresNoConfig) {
                return Promise.resolve();
            }

            // Re-set config of this instance.
            // We can skip the validation here because the config was already validated when it was initially set,
            // before getting saved to disk.
            // This results in faster loading when the validation takes time, e.g., makes HTTP requests.
            return this.instances
                .updateInstanceConfig(instanceName, instance.config, false)
                .then(async (result) => {
                    if (result.failed) {
                        throw result.errorMessage;
                    }
                })
                .catch((reason) => {
                    this.nodecg.log.warn(
                        `Couldn't load config of instance "${instanceName}" from saved configuration: ${reason}.`,
                    );
                });
        });
    }

    /**
     * Loads all passed bundle dependencies into the framework by setting them in the bundle manager.
     * @param bundles the bundle dependencies that should be set.
     */
    private loadBundleDependencies(bundles: ObjectMap<ServiceDependency<unknown>[]>): void {
        Object.entries(bundles).forEach(([bundleName, deps]) => {
            deps.forEach((svcDep) => {
                // Re-setting bundle service dependencies.
                // We can ignore the case of undefined, because the default is that the bundle doesn't get any service
                // which is modelled by undefined. We are assuming that there was nobody setting it to something different.
                if (svcDep.serviceInstance !== undefined) {
                    const inst = this.instances.getServiceInstance(svcDep.serviceInstance);
                    // Don't do anything if the service instance doesn't exist any more (probably deleted)
                    if (inst !== undefined) {
                        this.bundles.setServiceDependency(bundleName, svcDep.serviceInstance, inst);
                    }
                }
            });
        });
    }

    /**
     * Encrypts and saves current state to the persistent replicant.
     */
    save(): void {
        // Check if we have a encryption key to encrypt the data with.
        if (this.encryptionKey === undefined) {
            return;
        }

        // Organize all data that will be encrypted into a single object.
        const data: PersistentData = {
            instances: this.getServiceInstances(),
            bundleDependencies: this.bundles.getBundleDependencies(),
        };

        // Encrypt and save data to persistent replicant.
        const encryptionKeyArr = crypto.enc.Hex.parse(this.encryptionKey);
        const [cipherText, iv] = encryptData(data, encryptionKeyArr);
        this.encryptedData.value.cipherText = cipherText;
        this.encryptedData.value.iv = iv;
    }

    /**
     * Creates a copy of all service instances without the service clients, because those
     * shouldn't be serialized and don't need to be stored in the encrypted config file.
     */
    private getServiceInstances(): ObjectMap<ServiceInstance<unknown, unknown>> {
        const instances = this.instances.getServiceInstances();
        const copy: ObjectMap<ServiceInstance<unknown, unknown>> = {};

        Object.entries(instances).forEach(([instName, instance]) => {
            copy[instName] = {
                serviceType: instance.serviceType,
                config: instance.config,
                client: undefined,
            };
        });

        return copy;
    }

    /**
     * Saves the current configuration after all service instances have loaded.
     * @param promises the promises of the service instances
     */
    private async saveAfterServiceInstancesLoaded(promises: Promise<void>[]) {
        // We want to ignore errors because if a client in one instance cannot be created we still want to save the current state.
        const promisesWithoutErrs = promises.map((prom) => new Promise((resolve) => prom.then(resolve).catch(resolve)));

        // Wait till all promises either are done or have failed.
        await Promise.all(promisesWithoutErrs);

        this.nodecg.log.info("Finished creating service instances from stored configuration.");
        this.save();
    }

    /**
     * Checks whether automatic login is set up and enabled. If yes, it will do it using {@link PersistenceManager.setupAutomaticLogin}.
     */
    private checkAutomaticLogin(): void {
        if (this.nodecg.bundleConfig.automaticLogin?.enabled === undefined) {
            return; // Not configured
        }

        // If enabled isn't undefined the JSON schema guarantees that enabled is a boolean and password is a string
        const enabled: boolean = this.nodecg.bundleConfig.automaticLogin.enabled;
        const password: string = this.nodecg.bundleConfig.automaticLogin.password;

        if (enabled === false) {
            // We inform the user that automatic login is set up but not activated because having the ability
            // to disable it by setting the enabled flag to false is meant for temporary cases.
            // If automatic login is permanently not used the user should remove the password from the config
            // to regain the advantages of data-at-rest encryption which are slashed when the password is also stored on disk.
            this.nodecg.log.warn("Automatic login is setup but disabled.");
            return;
        }

        this.setupAutomaticLogin(password);
    }

    /**
     * Setups everything needed to automatically log in using the provided password after NodeCG has loaded.
     */
    private setupAutomaticLogin(password: string): void {
        // We need to do the login after all bundles have been loaded because when loading these might add bundle dependencies
        // or even register services which we need to load nodecg-io.
        // There is no official way to wait for NodeCG to be done loading, so we use more or less a hack to find that out:
        // When we declare the replicant here we will trigger a change event with an empty array.
        // Once NodeCG is done loading all bundles it'll assign an array of bundles that were loaded to this replicant
        // So if we want to wait for NodeCG to be loaded we can watch for changes on this replicant and
        // if we get a non-empty array it means that NodeCG has finished loading.
        this.nodecg.Replicant<unknown[]>("bundles", "nodecg").on("change", async (bundles) => {
            if (bundles.length > 0) {
                try {
                    this.nodecg.log.info("Attempting to automatically login...");

                    const salt = await getEncryptionSalt(this.encryptedData.value, password);
                    const encryptionKey = await deriveEncryptionKey(password, salt);
                    const loadResult = await this.load(encryptionKey);

                    if (!loadResult.failed) {
                        this.nodecg.log.info("Automatic login successful.");
                    } else {
                        throw new Error(loadResult.errorMessage);
                    }
                } catch (err) {
                    const logMessage = `Failed to automatically login: ${err}`;
                    if (this.isLoaded()) {
                        // load() threw an error but nodecg-io is currently loaded nonetheless.
                        // Anyway, nodecg-io is loaded which is what we wanted
                        this.nodecg.log.warn(logMessage);
                    } else {
                        // Something went wrong and nodecg-io is not loaded.
                        // This is a real error, the password might be wrong or some other issue.
                        this.nodecg.log.error(logMessage);
                    }
                }
            }
        });
    }
}
