import * as crypto from "crypto-js";
import { BundleManager } from "../bundleManager";
import { InstanceManager } from "../instanceManager";
import { decryptData, EncryptedData, PersistenceManager, PersistentData } from "../persistenceManager";
import { ServiceManager } from "../serviceManager";
import { ServiceProvider } from "../serviceProvider";
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

    describe("load", () => {
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

    test("should automatically save if BundleManager or InstanceManager emit a change event", async () => {
        await persistenceManager.load(validPassword); // Set password so that we can save stuff

        encryptedDataReplicant.value.cipherText = undefined;
        bundleManager.emit("change");
        expect(encryptedDataReplicant.value.cipherText).toBeDefined();

        encryptedDataReplicant.value.cipherText = undefined;
        instanceManager.emit("change");
        expect(encryptedDataReplicant.value.cipherText).toBeDefined();
    });

    describe("automatic login", () => {
        // TODO: test automatic login
    });

    // TODO: test isLoaded(), isFirstStartup() and checkPassword()
});
