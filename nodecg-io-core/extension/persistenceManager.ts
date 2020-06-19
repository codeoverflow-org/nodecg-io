import { NodeCG, ReplicantServer } from "nodecg/types/server";
import { InstanceManager } from "./instanceManager";
import { BundleManager } from "./bundleManager";
import * as crypto from "crypto-js";
import { emptySuccess, error, Result } from "./utils/result";
import { ObjectMap, ServiceDependency, ServiceInstance } from "./types";

/**
 * Models all the data that needs to be persistent in a plain manner.
 */
interface PersistentData {
    /**
     * All instance data that is held by the {@link InstanceManager}.
     */
    instances: ObjectMap<string, ServiceInstance<unknown, unknown>>;
    /**
     * All bundle dependency data that is held by the {@link BundleManager}.
     */
    bundleDependencies: ObjectMap<string, ServiceDependency<any>[]>;
}

/**
 * Models all the data that needs to be persistent in a encrypted manner.
 */
interface EncryptedData {
    /**
     * The encrypted format of the data that needs to be stored.
     */
    cipherText?: string;
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
        private readonly instances: InstanceManager,
        private readonly bundles: BundleManager,
    ) {
        this.encryptedData = nodecg.Replicant("encryptedConfig", {
            persistent: true, // Is ok since it is encrypted, all other replicants don't store data for this reason.
            defaultValue: {},
        });
    }

    /**
     * Encrypts and saves current state to the persistent replicant.
     */
    private save() {
        // Check if we have a password to encrypt the data with.
        if (this.password === undefined) {
            return;
        }

        // Organise all data that will be encrypted into a single object.
        const data: PersistentData = {
            instances: this.instances.getServiceInstances(),
            bundleDependencies: this.bundles.getBundleDependencies(),
        };

        // Encrypt and save data to persistent replicant.
        const cipherText = crypto.AES.encrypt(JSON.stringify(data), this.password);
        this.encryptedData.value.cipherText = cipherText.toString();
    }

    /**
     * Returns if the locally stored configuration has been loaded and a password has been set.
     */
    isLoaded(): boolean {
        return this.password !== undefined;
    }

    /**
     * Decrypts and loads the locally stored configuration using the passed password.
     * @param password the password of the encrypted config.
     * @return success if the password was correct and loading has been successful and an error if the password is wrong.
     */
    async load(password: string): Promise<Result<any>> {
        if (this.isLoaded()) {
            return error("Config has already been decrypted and loaded.");
        }

        if (this.encryptedData.value.cipherText === undefined) {
            // No encrypted data has been saved, probably because this is the first startup.
            // Therefore nothing needs to be decrypted and we write a empty config to disk.
            this.nodecg.log.info("No saved configuration found, creating a empty one.");
            this.save();
        } else {
            try {
                // Decrypt config
                this.nodecg.log.info("Decrypting and loading saved configuration.");
                const decryptedBytes = crypto.AES.decrypt(this.encryptedData.value.cipherText, password);
                const decryptedText = decryptedBytes.toString(crypto.enc.Utf8);
                const data: PersistentData = JSON.parse(decryptedText);

                // Load config into the respecting manager
                // Instances first as the bundle dependency depend upon the existing instances.
                this.loadServiceInstances(data.instances);
                this.loadBundleDependencies(data.bundleDependencies);
            } catch {
                return error("Password isn't correct.");
            }
        }

        // Save password, used in save() function
        this.password = password;

        // Register handlers to save when something changes
        this.instances.onInstanceUpdates(() => this.save());
        this.bundles.onBundleDependencyUpdates(() => this.save());

        return emptySuccess();
    }

    /**
     * Loads all passed instances into the framework by creating instances of the same type and name
     * and then setting the config of the passed object.
     * @param instances the service instances that should be loaded.
     */
    private loadServiceInstances(instances: ObjectMap<string, ServiceInstance<unknown, unknown>>) {
        for (const instanceName in instances) {
            if (!instances.hasOwnProperty(instanceName)) {
                continue;
            }
            const inst = instances[instanceName];
            if (inst === undefined) {
                continue;
            }

            // Re-create service instance.
            const result = this.instances.createServiceInstance(inst.serviceType, instanceName);
            if (result.failed) {
                this.nodecg.log.info(
                    `Couldn't load instance "${instanceName}" from saved configuration: ${result.errorMessage}`,
                );
                continue;
            }

            // Re-set config of this instance.
            // We can skip the validation here because the config was already validated when it was initially set,
            // before getting saved to disk.
            // This results in faster loading when the validation takes time, e.g. makes HTTP requests.
            this.instances
                .updateInstanceConfig(instanceName, inst.config, false)
                .then((result) => {
                    if (result.failed) {
                        this.nodecg.log.info(
                            `Couldn't load config of instance "${instanceName}" from saved configuration: ${result.errorMessage}.`,
                        );
                    }
                })
                .catch((reason) => {
                    this.nodecg.log.info(
                        `Couldn't load config of instance "${instanceName}" from saved configuration: ${reason}.`,
                    );
                });
        }
    }

    /**
     * Loads all passed bundle dependencies into the framework by setting them in the bundle manager.
     * @param bundles the bundle dependencies that should be set.
     */
    private loadBundleDependencies(bundles: ObjectMap<string, ServiceDependency<any>[]>): void {
        for (const bundleName in bundles) {
            if (!bundles.hasOwnProperty(bundleName)) {
                continue;
            }

            const deps = bundles[bundleName];
            deps?.forEach((svcDep) => {
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
        }
    }
}
