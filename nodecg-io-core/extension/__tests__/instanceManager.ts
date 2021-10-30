import { BundleManager } from "../bundleManager";
import { InstanceManager } from "../instanceManager";
import { ServiceInstance } from "../service";
import { ServiceManager } from "../serviceManager";
import { emptySuccess, error, success } from "../utils/result";
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

    const noConfigService = {
        ...testService,
        serviceType: "noConfigTest",
        createClient: jest.fn(),
        requiresNoConfig: true,
    };

    const serviceManager = new ServiceManager(nodecg);
    serviceManager.registerService(testService);
    serviceManager.registerService(noConfigService);

    const bundleManager = new BundleManager(nodecg);
    const testBundleProvider = bundleManager.registerServiceDependency(testBundle, testService);
    bundleManager.registerServiceDependency(testBundle2, testService);

    let instanceManager: InstanceManager;
    const changeCb = jest.fn();

    beforeEach(() => {
        instanceManager = new InstanceManager(nodecg, serviceManager, bundleManager);
        instanceManager.on("change", changeCb);
    });

    afterEach(() => {
        changeCb.mockReset();
        bundleManager.removeAllListeners(); // Removes reregisterInstance callback that BundleManager adds in its constructor
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

        test("should create a client if service requires no configuration", () => {
            noConfigService.createClient.mockReset();
            instanceManager.createServiceInstance(noConfigService.serviceType, testInstance);
            expect(noConfigService.createClient).toHaveBeenCalledTimes(1);
        });

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
        beforeEach(() => {
            instanceManager.createServiceInstance(testService.serviceType, testInstance);
            changeCb.mockReset(); // Don't track the call caused by service instance creation
        });

        afterEach(() => {
            testService.stopClient.mockReset();
            nodecg.log.error.mockReset();
        });

        test("should delete instance from internal instance list", () => {
            expect(instanceManager.deleteServiceInstance(testInstance)).toBe(true);
            expect(instanceManager.getServiceInstance(testInstance)).toBeUndefined();
            expect(instanceManager.getServiceInstances()).toStrictEqual({});
            expect(changeCb).toHaveBeenCalledTimes(1);
        });

        test("should log an error if there was an error when stopping the client", () => {
            // Set client which needs to exist if we want to have stopClient() called
            const instance = instanceManager.getServiceInstance(testInstance);
            if (!instance) throw new Error("instance was not saved");
            instance.client = testServiceInstance.client;

            // Mock stopClient() to throw a error
            const errorMsg = "client error message";
            testService.stopClient.mockImplementationOnce(() => {
                throw new Error(errorMsg);
            });

            instanceManager.deleteServiceInstance(testInstance);
            expect(nodecg.log.error).toHaveBeenCalledTimes(1);
            expect(nodecg.log.error.mock.calls[0][0]).toContain(errorMsg);
        });

        test("should call stopClient() on service if a client exists", () => {
            // Case 1: the instance has no client. No call to stopClient() should happen
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
            expect(testService.stopClient.mock.calls[0][0]).toBe(testServiceInstance.client);
        });

        test("should log error if client cannot be stopped because the service could not be found", () => {
            const instance = instanceManager.getServiceInstance(testInstance);
            if (!instance) throw new Error("instance could not be found");
            instance.client = testServiceInstance.client;

            // oh no, the service just got deleted from ServiceManager. It cannot be looked up anymore.
            const services = serviceManager.getServices().splice(0);

            const res = instanceManager.deleteServiceInstance(testInstance);

            // Re-add the removed services again so other tests can still use them
            services.forEach((svc) => serviceManager.registerService(svc));

            expect(res).toBe(true);
            expect(nodecg.log.error).toHaveBeenCalledTimes(1);
            expect(nodecg.log.error.mock.calls[0][0]).toContain("Failed to stop");
        });

        test("should unset all service dependencies that are assigned to this instance", () => {
            // We create two bundles and two instances to make sure that
            // deleting testInstance(1) does only unset the service dependencies of bundles
            // that actually are assigned to this service instance and
            // service dependencies that are assigned to other service instances should
            // not be interfered with.
            instanceManager.createServiceInstance(testService.serviceType, testInstance2);

            const instance1 = instanceManager.getServiceInstance(testInstance);
            const instance2 = instanceManager.getServiceInstance(testInstance2);
            if (!instance1 || !instance2) throw new Error("instances were not saved");

            bundleManager.setServiceDependency(testBundle, testInstance, instance1);
            bundleManager.setServiceDependency(testBundle2, testInstance2, instance2);

            expect(instanceManager.deleteServiceInstance(testInstance)).toBe(true);

            const deps = bundleManager.getBundleDependencies();
            expect(deps[testBundle]?.[0]?.serviceInstance).toBeUndefined();
            expect(deps[testBundle2]?.[0]?.serviceInstance).toBe(testInstance2);
        });

        test("should error when service instance doesn't exists", () => {
            // Note that we didn't create testInstance2 here
            const result = instanceManager.deleteServiceInstance(testInstance2);
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

        test("should ignore json schema if not provided", async () => {
            const svc = {
                ...testService,
                serviceType: "noJsonSchemaSvc",
                schema: undefined,
            };
            serviceManager.registerService(svc);
            instanceManager.createServiceInstance(svc.serviceType, testInstance2);

            const res = await instanceManager.updateInstanceConfig(testInstance2, validConfig);
            expect(res.failed).toBe(false);
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

        test("should error if service of instance doesn't exists anymore", async () => {
            const services = serviceManager.getServices().splice(0);
            const res = await instanceManager.updateInstanceConfig(testInstance, validConfig);
            services.forEach((svc) => serviceManager.registerService(svc));

            expect(res.failed).toBe(true);
            if (res.failed) {
                expect(res.errorMessage).toContain("service");
                expect(res.errorMessage).toContain("couldn't be found");
            }
        });
    });

    describe("updateInstanceClient", () => {
        let inst: ServiceInstance<string, () => string>;

        beforeEach(() => {
            testService.createClient.mockImplementation(async (cfg) => success(() => cfg));
            instanceManager.createServiceInstance(testService.serviceType, testInstance);
            inst = instanceManager.getServiceInstance(testInstance) as ServiceInstance<string, () => string>;
        });

        afterEach(() => {
            testService.createClient.mockReset();
            testService.stopClient.mockReset();
            nodecg.log.error.mockReset();
        });

        test("should create client if config is defined", async () => {
            const res = await instanceManager.updateInstanceClient(inst, testInstance, testService);

            expect(res.failed).toBe(false);
            expect(inst.client).toBeDefined();
            expect(inst.client?.()).toBe(inst.config);
            expect(testService.createClient).toHaveBeenCalledTimes(1);
            expect(testService.createClient.mock.calls[0][0]).toBe(inst.config);
        });

        test("should create client if no config is required, even if config is undefined", async () => {
            instanceManager.createServiceInstance(noConfigService.serviceType, "noConfigInst");
            const inst = instanceManager.getServiceInstance("noConfigInst") as ServiceInstance<string, () => string>;

            noConfigService.createClient.mockReset();
            noConfigService.createClient.mockImplementation(async () => success(() => "hello, no config provided"));
            inst.config = undefined;
            const res = await instanceManager.updateInstanceClient(inst, "noConfigInst", noConfigService);

            expect(res.failed).toBe(false);
            expect(noConfigService.createClient).toHaveBeenCalledTimes(1);
        });

        test("should not create client if config is undefined", async () => {
            inst.config = undefined;
            const res = await instanceManager.updateInstanceClient(inst, testInstance, testService);

            expect(res.failed).toBe(false);
            expect(inst.client).toBeUndefined();
            expect(testService.createClient).not.toHaveBeenCalled();
        });

        test("should set client to undefined if createClient() errors", async () => {
            const errorMessage = "some error message";
            testService.createClient.mockImplementation(async () => error(errorMessage));
            const res = await instanceManager.updateInstanceClient(inst, testInstance, testService);

            expect(res.failed).toBe(true);
            if (res.failed) {
                expect(res.errorMessage).toContain("error while creating a client");
                expect(res.errorMessage).toContain(errorMessage);
            }
            expect(inst.client).toBeUndefined();
        });

        test("should trigger bundle callbacks with new client", async () => {
            bundleManager.setServiceDependency(testBundle, testInstance, inst);

            const mockCallback = jest.fn();
            testBundleProvider?.onAvailable(mockCallback);

            const newMessage = "hello, I am a message from the newly created client";
            inst.config = newMessage;
            await instanceManager.updateInstanceClient(inst, testInstance, testService);

            expect(mockCallback).toHaveBeenCalledTimes(1);
            expect(mockCallback.mock.calls[0][0]?.()).toBe(newMessage); // Make sure new client ond not an old one was passed
        });

        test("should stop old client of the service instance, if one exists", async () => {
            // Create the initial client with the default config
            await instanceManager.updateInstanceClient(inst, testInstance, testService);

            // Change config and re-update client
            inst.config = "some other text";
            const res = await instanceManager.updateInstanceClient(inst, testInstance, testService);

            expect(res.failed).toBe(false);
            expect(inst.client?.()).toBe(inst.config); // Current client should stem from new config

            // Old client that still refers to old config has been stopped using stopClient() of the service
            expect(testService.stopClient).toHaveBeenCalledTimes(1);
            expect(testService.stopClient.mock.calls[0][0]?.()).toBe(testService.defaultConfig);
        });

        test("should log an error if stopping the old client using stopClient() throws an error", async () => {
            // Create initial client
            await instanceManager.updateInstanceClient(inst, testInstance, testService);

            const errorMsg = "client stop error message";
            testService.stopClient.mockImplementationOnce(() => {
                throw new Error(errorMsg);
            });

            // Recreate client, which will result in call to stopClient() with old client
            await instanceManager.updateInstanceClient(inst, testInstance, testService);
            expect(nodecg.log.error).toHaveBeenCalledTimes(1);
            expect(nodecg.log.error.mock.calls[0][0]).toContain(errorMsg);
        });
    });

    describe("reregisterHandlersOfInstance", () => {
        beforeEach(async () => {
            instanceManager.createServiceInstance(testService.serviceType, testInstance);
            testService.createClient.mockReset();
            testService.createClient.mockImplementation((cfg) => success(() => cfg));
            testService.removeHandlers.mockReset();
            nodecg.log.error.mockReset();
        });

        test("should do nothing if passing undefined as instance name", () => {
            bundleManager.emit("reregisterInstance", undefined);
            expect(nodecg.log.error).not.toHaveBeenCalled(); // Ensure it didn't log a error because passing undefined must be supported
        });

        test("should error if a name of a non-existent instance was passed", () => {
            bundleManager.emit("reregisterInstance", "nonExistentInstance");
            expect(nodecg.log.error).toHaveBeenCalledTimes(1);
            expect(nodecg.log.error.mock.calls[0][0]).toContain("instance not found");
        });

        test("should error if service of instance cannot be found anymore", () => {
            // Remove service from ServiceManager so it cannot be found anymore
            const services = serviceManager.getServices().splice(0);

            bundleManager.emit("reregisterInstance", testInstance);

            // Re-add the removed services again
            services.forEach((svc) => serviceManager.registerService(svc));

            expect(nodecg.log.error).toHaveBeenCalledTimes(1);
            expect(nodecg.log.error.mock.calls[0][0]).toContain("can't get service");
        });

        test("should re-create client if reCreateClientToRemoveHandlers is set", () => {
            const svc = {
                ...testService,
                serviceType: "reCreateClientToRemoveHandlers",
                reCreateClientToRemoveHandlers: true,
            };
            serviceManager.registerService(svc);
            const instName = `${svc.serviceType}Inst`;
            instanceManager.createServiceInstance(svc.serviceType, instName);
            const inst = instanceManager.getServiceInstance(instName);
            if (!inst) throw new Error("instance was not saved");

            bundleManager.emit("reregisterInstance", instName);

            expect(svc.removeHandlers).not.toHaveBeenCalled();
            expect(svc.createClient).toHaveBeenCalledTimes(1);
            expect(svc.createClient.mock.calls[0][0]).toBe(inst.config);
        });

        test("should do nothing if removeHandlers is not implemented by the service", () => {
            const svc = {
                ...testService,
                serviceType: "noRemoveHandlers",
                removeHandlers: undefined,
            };
            serviceManager.registerService(svc);
            const instName = `${svc.serviceType}Inst`;
            instanceManager.createServiceInstance(svc.serviceType, instName);
            const inst = instanceManager.getServiceInstance(instName);
            if (!inst) throw new Error("instance was not saved");

            const provider = bundleManager.registerServiceDependency(testBundle, svc);
            bundleManager.setServiceDependency(testBundle, "noRemoveHandlersInst", inst);
            const availabilityCb = jest.fn();
            provider?.onAvailable(availabilityCb);

            bundleManager.emit("reregisterInstance", instName);

            expect(svc.createClient).not.toHaveBeenCalled();
            expect(availabilityCb).not.toHaveBeenCalled();
        });

        test("should call removeHandlers() with client and re-add handlers by triggering bundle callbacks", () => {
            const inst = instanceManager.getServiceInstance(testInstance);
            if (!inst) throw new Error("testInstance not found");
            inst.client = testServiceInstance.client;

            bundleManager.setServiceDependency(testBundle, testInstance, inst);
            const availabilityCb = jest.fn();
            testBundleProvider?.onAvailable(availabilityCb);

            testService.removeHandlers.mockReset();
            bundleManager.emit("reregisterInstance", testInstance);

            expect(testService.removeHandlers).toHaveBeenCalledTimes(1);
            expect(testService.removeHandlers).toHaveBeenCalledWith(inst.client);
            expect(testService.createClient).not.toHaveBeenCalled();
            expect(availabilityCb).toHaveBeenCalledTimes(1);
            expect(availabilityCb).toHaveBeenCalledWith(inst.client);
        });

        test("should error if call to removeHandlers() throws an error", () => {
            const inst = instanceManager.getServiceInstance(testInstance);
            if (!inst) throw new Error("testInstance not found");
            inst.client = testServiceInstance.client;

            const errorMsg = "remove handlers error message";
            testService.removeHandlers.mockImplementationOnce(() => {
                throw new Error(errorMsg);
            });

            bundleManager.emit("reregisterInstance", testInstance);
            expect(nodecg.log.error).toHaveBeenCalledTimes(1);
            expect(nodecg.log.error.mock.calls[0][0]).toContain(errorMsg);
        });
    });
});
