import { NodeCG, ReplicantServer } from "nodecg-types/types/server";
import { InstanceManager } from "./instanceManager";
import { BundleManager } from "./bundleManager";
import * as crypto from "crypto-js";
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
 * Models all the data that needs to be persistent in a encrypted manner.
 */
export interface EncryptedData {
    /**
     * The encrypted format of the data that needs to be stored.
     */
    cipherText?: string;
}

/**
 * Decrypts the passed encrypted data using the passed password.
 * If the password is wrong an error will be returned.
 *
 * @param cipherText the ciphertext that needs to be decrypted.
 * @param password the password for the encrypted data.
 */
export function decryptData(cipherText: string, password: string): Result<PersistentData> {
    try {
        const decryptedBytes = crypto.AES.decrypt(cipherText, password);
        const decryptedText = decryptedBytes.toString(crypto.enc.Utf8);
        const data: PersistentData = JSON.parse(decryptedText);
        return success(data);
    } catch {
        return error("Password isn't correct.");
    }
}

/**
 * Manages encrypted persistence of data that is held by the instance and bundle managers.
 */
export class PersistenceManager {
    private password: string | undefined;
    // We store the encrypted data in a replicant, because writing files in a nodecg bundle isn't very clean
    // and the bundle config is readonly. It is only in encrypted form so it is ok to be accessible in the browser.
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
     * Checks whether the passed password is correct. Only works if already loaded and a password is already set.
     * @param password the password which should be checked for correctness
     */
    checkPassword(password: string): boolean {
        if (this.isLoaded()) {
            return this.password === password;
        } else {
            return false;
        }
    }

    /**
     * Returns if the locally stored configuration has been loaded and a password has been set.
     */
    isLoaded(): boolean {
        return this.password !== undefined;
    }

    /**
     * Returns whether this is the first startup aka. whether any encrypted data has been saved.
     * If this returns true {{@link load}} will accept any password and use it to encrypt the configuration.
     */
    isFirstStartup(): boolean {
        return this.encryptedData.value.cipherText === undefined;
    }

    /**
     * Decrypts and loads the locally stored configuration using the passed password.
     * @param password the password of the encrypted config.
     * @return success if the password was correct and loading has been successful and an error if the password is wrong.
     */
    async load(password: string): Promise<Result<void>> {
        if (this.isLoaded()) {
            return error("Config has already been decrypted and loaded.");
        }

        if (this.encryptedData.value.cipherText === undefined) {
            // No encrypted data has been saved, probably because this is the first startup.
            // Therefore nothing needs to be decrypted and we write a empty config to disk.
            this.nodecg.log.info("No saved configuration found, creating a empty one.");
            this.password = password;
            this.save();
        } else {
            // Decrypt config
            this.nodecg.log.info("Decrypting and loading saved configuration.");
            const data = decryptData(this.encryptedData.value.cipherText, password);
            if (data.failed) {
                return data;
            }

            // Load config into the respecting manager
            // Instances first as the bundle dependency depend upon the existing instances.
            const promises = this.loadServiceInstances(data.result.instances);
            this.loadBundleDependencies(data.result.bundleDependencies);
            this.saveAfterServiceInstancesLoaded(promises);
        }

        // Save password, used in save() function
        this.password = password;

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
            // This results in faster loading when the validation takes time, e.g. makes HTTP requests.
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
                // which is modeled by undefined. We are assuming that there was nobody setting it to something different.
                if (svcDep.serviceInstance !== undefined) {
                    const inst = this.instances.getServiceInstance(svcDep.serviceInstance);
                    // Don't do anything if the service instance doesn't exist anymore (probably deleted)
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
        // Check if we have a password to encrypt the data with.
        if (this.password === undefined) {
            return;
        }

        // Organize all data that will be encrypted into a single object.
        const data: PersistentData = {
            instances: this.getServiceInstances(),
            bundleDependencies: this.bundles.getBundleDependencies(),
        };

        // Encrypt and save data to persistent replicant.
        const cipherText = crypto.AES.encrypt(JSON.stringify(data), this.password);
        this.encryptedData.value.cipherText = cipherText.toString();
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
     * Checks whether automatic login is setup and enabled. If yes it will do it using {@link PersistenceManager.setupAutomaticLogin}.
     */
    private checkAutomaticLogin(): void {
        if (this.nodecg.bundleConfig.automaticLogin?.enabled === undefined) {
            return; // Not configured
        }

        // If enabled isn't undefined the JSON schema guarantees that enabled is a boolean and password is a string
        const enabled: boolean = this.nodecg.bundleConfig.automaticLogin.enabled;
        const password: string = this.nodecg.bundleConfig.automaticLogin.password;

        if (enabled === false) {
            // We inform the user that automatic login is setup but not activated because having the ability
            // to disable it by setting the enabled flag to false is meant for temporary cases.
            // If automatic login is permanently not used the user should remove the password from the config
            // to regain the advantages of data-at-rest encryption which are slashed when the password is also stored on disk.
            this.nodecg.log.warn("Automatic login is setup but disabled.");
            return;
        }

        this.setupAutomaticLogin(password);
    }

    /**
     * Setups everything needed to automatically login using the provided password after nodecg has loaded.
     */
    private setupAutomaticLogin(password: string): void {
        // We need to do the login after all bundles have been loaded because when loading these might add bundle dependencies
        // or even register services which we need to load nodecg-io.
        // There is no official way to wait for nodecg to be done loading so we use more or less a hack to find that out:
        // When we declare the replicant here we will trigger a change event with a empty array.
        // Once nodecg is done loading all bundles it'll assign a array of bundles that were loaded to this replicant
        // So if we want to wait for nodecg to be loaded we can watch for changes on this replicant and
        // if we get a non-empty array it means that nodecg has finished loading.
        this.nodecg.Replicant<unknown[]>("bundles", "nodecg").on("change", async (bundles) => {
            if (bundles.length > 0) {
                try {
                    this.nodecg.log.info("Attempting to automatically login...");
                    const loadResult = await this.load(password);

                    if (!loadResult.failed) {
                        this.nodecg.log.info("Automatic login successful.");
                    } else {
                        throw loadResult.errorMessage;
                    }
                } catch (err) {
                    this.nodecg.log.error(`Failed to automatically login: ${err}`);
                }
            }
        });
    }
}
