import { BundleManager } from "../bundleManager";
import { InstanceManager } from "../instanceManager";
import { ServiceManager } from "../serviceManager";
import { emptySuccess, error } from "../utils/result";
import {
    MockNodeCG,
    testBundle,
    testBundle2,
    testInstance,
    testInstance2,
    testService,
    testServiceInstance,
} from "./mocks";

describe("InstanceManager", () => {
    const nodecg = new MockNodeCG();

    const serviceManager = new ServiceManager(nodecg);
    serviceManager.registerService(testService);

    const bundleManager = new BundleManager(nodecg);
    // We have over 10 tests which each create a new InstanceManager which adds a listener
    // so we need to increase the limit to prevent a EventEmitter leak warning by node.js.
    bundleManager.setMaxListeners(20);
    bundleManager.registerServiceDependency(testBundle, testService);
    bundleManager.registerServiceDependency(testBundle2, testService);

    let instanceManager: InstanceManager;
    const changeCb = jest.fn();

    beforeEach(() => {
        changeCb.mockReset();
        instanceManager = new InstanceManager(nodecg, serviceManager, bundleManager);
        instanceManager.on("change", changeCb);
    });

    describe("createServiceInstance", () => {
        test("should work when name is unused and service exists", () => {
            const res = instanceManager.createServiceInstance(testService.serviceType, testInstance);
            expect(res.failed).toBe(false);
            expect(changeCb).toHaveBeenCalledTimes(1);

            // Make sure instance has been added to the instance list with the correct service type
            expect(instanceManager.getServiceInstance(testInstance)).toBeDefined();
            expect(instanceManager.getServiceInstance(testInstance)?.serviceType).toBe(testService.serviceType);
        });

        test("should set config to default config of service", () => {
            instanceManager.createServiceInstance(testService.serviceType, testInstance);
            expect(instanceManager.getServiceInstance(testInstance)?.config).toBe(testService.defaultConfig);
        });

        // TODO: implement this
        test.todo("should create a client if service requires no configuration");

        test("should error if name is empty", () => {
            const res = instanceManager.createServiceInstance(testService.serviceType, "");
            expect(res.failed).toBe(true);
            if (res.failed) {
                expect(res.errorMessage).toContain("name must not be empty");
            }
            expect(changeCb).not.toHaveBeenCalled();
        });

        test("should error if a service instance with the same name already exists", () => {
            const res1 = instanceManager.createServiceInstance(testService.serviceType, testInstance);
            expect(res1.failed).toBe(false);

            const res2 = instanceManager.createServiceInstance(testService.serviceType, testInstance);
            expect(res2.failed).toBe(true);
            if (res2.failed) {
                expect(res2.errorMessage).toContain("same name already exists");
            }
            expect(changeCb).toHaveBeenCalledTimes(1); // One time from the first registration. No second time because we had an error
        });

        test("should error if there is no service with the passed service type", () => {
            const res = instanceManager.createServiceInstance("otherService", testInstance);
            expect(res.failed).toBe(true);
            if (res.failed) {
                expect(res.errorMessage).toContain("service type hasn't been registered");
            }
            expect(changeCb).not.toHaveBeenCalled();
        });
    });

    describe("deleteServiceInstance", () => {
        test("should delete instance from internal instance list", () => {
            instanceManager.createServiceInstance(testService.serviceType, testInstance);
            changeCb.mockReset(); // Don't track the call caused by service instance creation

            expect(instanceManager.deleteServiceInstance(testInstance)).toBe(true);
            expect(instanceManager.getServiceInstance(testInstance)).toBeUndefined();
            expect(instanceManager.getServiceInstances()).toStrictEqual({});
            expect(changeCb).toHaveBeenCalledTimes(1);
        });

        test("should call stopClient() on service if a client exists", () => {
            // Case 1: the instance has no client. No call to stopClient() should happen
            instanceManager.createServiceInstance(testService.serviceType, testInstance);
            instanceManager.deleteServiceInstance(testInstance);

            expect(testService.stopClient).not.toHaveBeenCalled();
            testService.stopClient.mockReset();

            // Case 2: the instance has generated a client. It should be stopped with a call to stopClient()
            instanceManager.createServiceInstance(testService.serviceType, testInstance);
            const instance = instanceManager.getServiceInstance(testInstance);
            if (!instance) throw new Error("instance was not saved");

            instance.client = testServiceInstance.client;
            expect(instanceManager.deleteServiceInstance(testInstance)).toBe(true);

            expect(testService.stopClient).toHaveBeenCalledTimes(1);
            expect(testService.stopClient).toHaveBeenCalledWith(testServiceInstance.client);

            testService.stopClient.mockReset();
        });

        test("should unset all service dependencies that are assigned to this instance", () => {
            // We create two bundles and two instances to make sure that
            // deleting testInstance(1) does only unset the service dependencies of bundles
            // that actually are assigned to this service instance and
            // service dependencies that are assigned to other service instances should
            // not be interfered with.
            instanceManager.createServiceInstance(testService.serviceType, testInstance);
            instanceManager.createServiceInstance(testService.serviceType, testInstance2);

            const instance1 = instanceManager.getServiceInstance(testInstance);
            const instance2 = instanceManager.getServiceInstance(testInstance2);
            if (!instance1 || !instance2) throw new Error("instances were not saved");

            bundleManager.setServiceDependency(testBundle, testInstance, instance1);
            bundleManager.setServiceDependency(testBundle2, testInstance2, instance2);

            expect(instanceManager.deleteServiceInstance(testInstance)).toBe(true);

            const deps = bundleManager.getBundleDependencies();
            expect(deps[testBundle]?.[0].serviceInstance).toBeUndefined();
            expect(deps[testBundle2]?.[0].serviceInstance).toBe(testInstance2);
        });

        test("should error service instance doesn't exists", () => {
            // Note that we didn't create testInstance here, unlike in the other tests
            const result = instanceManager.deleteServiceInstance(testInstance);
            expect(result).toBe(false);
            expect(changeCb).not.toHaveBeenCalled();
        });
    });

    describe("updateInstanceConfig", () => {
        const validConfig = "hello";
        const schemaInvalidConfig = 5;
        const funcInvalidConfig = "";

        beforeEach(() => {
            instanceManager.createServiceInstance(testService.serviceType, testInstance);
            changeCb.mockReset(); // Don't count change event from service instance creation

            // updateInstanceClient is big enough that it gets tested separately
            // therefore we have just a empty mock implementation when testing updateInstanceConfig.
            instanceManager.updateInstanceClient = jest.fn(() => Promise.resolve(emptySuccess()));

            // This is our fake validateConfig function that gets used to make sure that the
            // validateConfig function of a service gets called.
            // It returns an error if the config string is empty and success otherwise.
            testService.validateConfig.mockImplementation(async (config: string) => {
                if (config.length === 0) return error("string is empty");
                else return emptySuccess();
            });
        });

        afterEach(() => {
            testService.validateConfig.mockReset();
        });

        test("should update config synchronously if validation is not needed", async () => {
            // Validation is disabled by last argument
            const res = instanceManager.updateInstanceConfig(testInstance, validConfig, false);

            // Config must be update right after the function returns. We DO NOT wait for the promise to resolve.
            expect(instanceManager.getServiceInstance(testInstance)?.config).toBe(validConfig);
            expect(changeCb).toHaveBeenCalledTimes(1);
            expect((await res).failed).toBe(false);
        });

        test("should update config asynchronously if validation is needed", async () => {
            const res = instanceManager.updateInstanceConfig(testInstance, validConfig);
            // Right after function call it should still have the old config
            expect(instanceManager.getServiceInstance(testInstance)?.config).toBe(testService.defaultConfig);
            expect(changeCb).not.toHaveBeenCalled();

            expect((await res).failed).toBe(false);

            // After promise has resolved and validation passed the config should be set to the new one
            expect(instanceManager.getServiceInstance(testInstance)?.config).toBe(validConfig);
            expect(changeCb).toHaveBeenCalledTimes(1);
        });

        test("should validate config against json schema", async () => {
            // The JSON schema of testService makes sure that only strings are passed in

            // Using validSchema which is a string should be fine
            const res1 = await instanceManager.updateInstanceConfig(testInstance, validConfig);
            expect(res1.failed).toBe(false);
            expect(changeCb).toHaveBeenCalledTimes(1); // validation passed, should emit change event
            changeCb.mockReset();

            // Using schemaInvalidConfig which is a number should error.
            const res2 = await instanceManager.updateInstanceConfig(testInstance, schemaInvalidConfig);
            expect(res2.failed).toBe(true);
            if (res2.failed) {
                expect(res2.errorMessage).toContain("data must be string");
            }
            // Validation failed, shouldn't update config and shouldn't emit change event
            expect(instanceManager.getServiceInstance(testInstance)?.config).toBe(validConfig); // From the try before
            expect(changeCb).not.toHaveBeenCalled();
        });

        test("should validate config using the validateConfig() function of the service", async () => {
            // Refer to the mock implementation of validateConfig up top for details

            // Using validConfig with a non empty string should be fine
            const res1 = await instanceManager.updateInstanceConfig(testInstance, validConfig);
            expect(res1.failed).toBe(false);
            expect(changeCb).toHaveBeenCalledTimes(1); // validation passed, should emit change event
            changeCb.mockReset();

            // Using funcInvalidConfig with a empty string should cause an error.
            const res2 = await instanceManager.updateInstanceConfig(testInstance, funcInvalidConfig);
            expect(res2.failed).toBe(true);
            if (res2.failed) {
                expect(res2.errorMessage).toContain("string is empty");
            }
            // Validation failed, shouldn't update config and shouldn't emit change event
            expect(instanceManager.getServiceInstance(testInstance)?.config).toBe(validConfig); // From the try before
            expect(changeCb).not.toHaveBeenCalled();
        });

        test("should error if service instance doesn't exists", async () => {
            const res = await instanceManager.updateInstanceConfig("otherInstance", validConfig);
            expect(res.failed).toBe(true); // otherInstance doesn't exist, just testInstance
            if (res.failed) {
                expect(res.errorMessage).toContain("instance doesn't exist");
            }
        });
    });

    // TODO: add tests for updateInstanceClient
    // TODO: add tests for reregisterHandlersOfInstance?
});
