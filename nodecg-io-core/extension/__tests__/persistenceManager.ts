import * as crypto from "crypto-js";
import { BundleManager } from "../bundleManager";
import { InstanceManager } from "../instanceManager";
import { decryptData, EncryptedData, PersistenceManager, PersistentData } from "../persistenceManager";
import { ServiceManager } from "../serviceManager";
import { ServiceProvider } from "../serviceProvider";
import { emptySuccess, error } from "../utils/result";
import { MockNodeCG, testBundle, testInstance, testService, testServiceInstance } from "./mocks";

describe("PersistenceManager", () => {
    const validPassword = "myPassword";
    const invalidPassword = "someOtherPassword";

    const nodecg = new MockNodeCG();
    const serviceManager = new ServiceManager(nodecg);
    serviceManager.registerService(testService);

    let bundleManager: BundleManager;
    let instanceManager: InstanceManager;

    const encryptedDataReplicant = nodecg.Replicant<EncryptedData>("encryptedConfig");
    let persistenceManager: PersistenceManager;

    beforeEach(() => {
        encryptedDataReplicant.removeAllListeners();
        encryptedDataReplicant.value = {};

        bundleManager = new BundleManager(nodecg);
        bundleManager.registerServiceDependency(testBundle, testService); // Would be done by a bundle at startup
        instanceManager = new InstanceManager(nodecg, serviceManager, bundleManager);

        persistenceManager = new PersistenceManager(nodecg, serviceManager, instanceManager, bundleManager);
    });

    /**
     * Creates a basic config and encrypts it. Used to check whether load decrypts and more importantly
     * restores the same configuration again.
     */
    function defaultEncryptedConfig() {
        const data: PersistentData = {
            bundleDependencies: {
                [testBundle]: [
                    {
                        serviceType: testService.serviceType,
                        serviceInstance: testInstance,
                        provider: new ServiceProvider(),
                    },
                ],
            },
            instances: {
                [testInstance]: testServiceInstance,
            },
        };
        return crypto.AES.encrypt(JSON.stringify(data), validPassword).toString();
    }

    describe("checkPassword", () => {
        test("should return false if not loaded", () => {
            expect(persistenceManager.checkPassword(validPassword)).toBe(false);
        });

        test("should return false if loaded but password is wrong", async () => {
            await persistenceManager.load(validPassword);
            expect(persistenceManager.checkPassword(invalidPassword)).toBe(false);
        });

        test("should return true if loaded and password is correct", async () => {
            await persistenceManager.load(validPassword);
            expect(persistenceManager.checkPassword(validPassword)).toBe(true);
        });
    });

    describe("isLoaded", () => {
        test("should return false if not load was not called before", async () => {
            expect(persistenceManager.isLoaded()).toBe(false);
        });

        test("should return false if load was called but failed", async () => {
            encryptedDataReplicant.value.cipherText = defaultEncryptedConfig();
            const res = await persistenceManager.load(invalidPassword); // Will fail because the password is invalid
            expect(res.failed).toBe(true);
            expect(persistenceManager.isLoaded()).toBe(false);
        });

        test("should return true if load was called and succeeded", async () => {
            encryptedDataReplicant.value.cipherText = defaultEncryptedConfig();
            const res = await persistenceManager.load(validPassword); // password is correct, should work
            expect(res.failed).toBe(false);
            expect(persistenceManager.isLoaded()).toBe(true);
        });
    });

    describe("isFirstStartup", () => {
        test("should return true if no encrypted config exists", () => {
            encryptedDataReplicant.value.cipherText = undefined; // no config = first startup
            expect(persistenceManager.isFirstStartup()).toBe(true);
        });

        test("should return false if an encrypted config exists", () => {
            encryptedDataReplicant.value.cipherText = defaultEncryptedConfig(); // config = not a first startup
            expect(persistenceManager.isFirstStartup()).toBe(false);
        });
    });

    describe("load", () => {
        test("should error if called after configuration already has been loaded", async () => {
            const res1 = await persistenceManager.load(validPassword);
            expect(res1.failed).toBe(false);
            const res2 = await persistenceManager.load(validPassword);
            expect(res2.failed).toBe(true);
            if (res2.failed) {
                expect(res2.errorMessage).toContain("already been decrypted and loaded");
            }
        });

        test("should save current state if no encrypted config was found", async () => {
            const res = await persistenceManager.load(validPassword);
            expect(res.failed).toBe(false);
            expect(encryptedDataReplicant.value.cipherText).toBeDefined();
        });

        test("should error if password is wrong", async () => {
            encryptedDataReplicant.value.cipherText = defaultEncryptedConfig();
            const res = await persistenceManager.load(invalidPassword);
            expect(res.failed).toBe(true);
            if (res.failed) {
                expect(res.errorMessage).toContain("Password isn't correct");
            }
        });

        test("should succeed if password is correct", async () => {
            encryptedDataReplicant.value.cipherText = defaultEncryptedConfig();
            const res = await persistenceManager.load(validPassword);
            expect(res.failed).toBe(false);
        });

        test("should load service instances including configuration", async () => {
            encryptedDataReplicant.value.cipherText = defaultEncryptedConfig();
            await persistenceManager.load(validPassword);
            const inst = instanceManager.getServiceInstance(testInstance);
            expect(inst).toBeDefined();
            if (!inst) return;
            expect(inst.config).toBe(testServiceInstance.config);
            expect(inst.serviceType).toBe(testService.serviceType);
        });

        test("should load service dependency assignments", async () => {
            encryptedDataReplicant.value.cipherText = defaultEncryptedConfig();
            await persistenceManager.load(validPassword);
            const deps = bundleManager.getBundleDependencies()[testBundle];
            expect(deps).toBeDefined();
            if (!deps) return;
            expect(deps).toHaveLength(1);
            expect(deps[0].serviceType).toBe(testService.serviceType);
            expect(deps[0].serviceInstance).toBe(testInstance);
        });
    });

    describe("save", () => {
        test("should do nothing if framework isn't loaded", () => {
            persistenceManager.save();
            expect(encryptedDataReplicant.value.cipherText).toBeUndefined();
        });

        test("should encrypt and save configuration if framework is loaded", async () => {
            const res = await persistenceManager.load(validPassword);
            expect(res.failed).toBe(false);

            instanceManager.createServiceInstance(testService.serviceType, testInstance);
            const inst = instanceManager.getServiceInstance(testInstance);
            if (!inst) throw new Error("instance was not saved");
            bundleManager.setServiceDependency(testBundle, testInstance, inst);

            persistenceManager.save();

            // Make sure that something got saved
            expect(encryptedDataReplicant.value.cipherText).toBeDefined();
            expect(typeof encryptedDataReplicant.value.cipherText).toBe("string");
            if (!encryptedDataReplicant.value.cipherText) return;

            // Decrypt and check that the information that was saved is correct
            const data = decryptData(encryptedDataReplicant.value.cipherText, validPassword);
            if (data.failed) throw new Error("could not decrypt newly encrypted data");

            expect(data.result.instances[testInstance]?.serviceType).toBe(testService.serviceType);
            expect(data.result.instances[testInstance]?.config).toBe(testService.defaultConfig);
            expect(data.result.bundleDependencies[testBundle]?.[0].serviceType).toBe(testService.serviceType);
            expect(data.result.bundleDependencies[testBundle]?.[0].serviceInstance).toBe(testInstance);
        });
    });

    describe("automatic login", () => {
        const nodecgBundleReplicant = nodecg.Replicant("bundles", "nodecg");

        async function triggerAutomaticLogin() {
            nodecg.log.info.mockReset();
            nodecg.log.warn.mockReset();
            nodecg.log.error.mockReset();

            persistenceManager = new PersistenceManager(nodecg, serviceManager, instanceManager, bundleManager);
            persistenceManager.load = jest.fn().mockImplementation(async (password: string) => {
                if (password === validPassword) return emptySuccess();
                else return error("password invalid");
            });
            nodecgBundleReplicant.value = [nodecg.bundleName];
        }

        afterEach(() => {
            nodecg.bundleConfig = {};
            nodecgBundleReplicant.removeAllListeners();
        });

        test("should be disabled when not configured in core bundle config", async () => {
            await triggerAutomaticLogin();
            expect(persistenceManager.load).not.toHaveBeenCalled();
            expect(nodecg.log.info).not.toHaveBeenCalled();
        });

        test("should be disabled when configured but disabled", async () => {
            nodecg.bundleConfig = {
                automaticLogin: {
                    enabled: false,
                    password: validPassword,
                },
            };

            await triggerAutomaticLogin();
            expect(persistenceManager.load).not.toHaveBeenCalled();
            // Warning that automatic login is setup.
            // Users should remove it from the config if not automatic login is permanently not used.
            expect(nodecg.log.warn).toHaveBeenCalled();
        });

        test("should be enabled when configured and enabled", async () => {
            nodecg.bundleConfig = {
                automaticLogin: {
                    enabled: true,
                    password: validPassword,
                },
            };

            await triggerAutomaticLogin();
            expect(persistenceManager.load).toHaveBeenCalled();
            expect(nodecg.log.info).toHaveBeenCalled();
            expect(nodecg.log.info.mock.calls[0][0]).toContain("automatically login");
        });

        test("should log success if loading worked", async () => {
            nodecg.bundleConfig = {
                automaticLogin: {
                    enabled: true,
                    password: validPassword,
                },
            };

            await triggerAutomaticLogin();
            expect(persistenceManager.load).toHaveBeenCalled();
            expect(nodecg.log.info).toHaveBeenCalledTimes(2);
            expect(nodecg.log.info.mock.calls[1][0]).toContain("login successful");
        });

        test("should log error if loading failed", async () => {
            nodecg.bundleConfig = {
                automaticLogin: {
                    enabled: true,
                    password: invalidPassword,
                },
            };

            await triggerAutomaticLogin();
            expect(persistenceManager.load).toHaveBeenCalled();
            expect(nodecg.log.error).toHaveBeenCalledTimes(1);
            expect(nodecg.log.error.mock.calls[0][0]).toContain("Failed to automatically login");
        });
    });

    test("should automatically save if BundleManager or InstanceManager emit a change event", async () => {
        await persistenceManager.load(validPassword); // Set password so that we can save stuff

        encryptedDataReplicant.value.cipherText = undefined;
        bundleManager.emit("change");
        expect(encryptedDataReplicant.value.cipherText).toBeDefined();

        encryptedDataReplicant.value.cipherText = undefined;
        instanceManager.emit("change");
        expect(encryptedDataReplicant.value.cipherText).toBeDefined();
    });
});