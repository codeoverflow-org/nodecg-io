import { MockNodeCG, testBundle, testService, testServiceInstance } from "./mocks";
import { BundleManager } from "../bundleManager";

describe("BundleManager", () => {
    let bundleManager: BundleManager;
    // BundleManager (like many managers) emit events with the name "change" to indicate that
    // something has been added, updated or removed to trigger PersistanceManager which will
    // save everything to disk.
    // We make sure that this event is emitted each time it should because otherwise this could mean a loss of data
    // and make sure that it doesn't get called when there was an error.
    const changeCb = jest.fn();

    beforeEach(() => {
        changeCb.mockReset();
        bundleManager = new BundleManager(new MockNodeCG());
        bundleManager.on("change", changeCb);
    });

    test("should start with no bundle dependencies", () => {
        expect(bundleManager.getBundleDependencies()).toStrictEqual({});
    });

    describe("registerServiceDependency", () => {
        test("should save service dependency and return a provider if the service dependency is the first", () => {
            const provider = bundleManager.registerServiceDependency(testBundle, testService);
            expect(provider).toBeTruthy();
            expect(changeCb).toHaveBeenCalled();
            // Make sure that the registration was actually stored.
            expect(bundleManager.getBundleDependencies()[testBundle]?.[0]?.serviceType).toBe(testService.serviceType);
        });

        test("should error if registering a dependency on the same service twice", () => {
            const bundleManager = new BundleManager(new MockNodeCG());
            // Depending on testService for the first time => fine
            bundleManager.registerServiceDependency(testBundle, testService);
            // Depending on testService for the second time => not fine
            const provider = bundleManager.registerServiceDependency(testBundle, testService);
            expect(provider).toBeUndefined();
            expect(changeCb).not.toHaveBeenCalled(); // When there is a error there shouldn't be a update
        });
    });

    /**
     * A util function for all tests that require a registered test service but don't test the registerServiceDependency function.
     * Automatically removes call to changeCb so that these tests don't need to worry about the call caused by registerServiceDependency.
     * @returns the service provider of the service dependency
     */
    function registerTestServiceDep() {
        const provider = bundleManager.registerServiceDependency(testBundle, testService);
        changeCb.mock.calls.pop(); // Remove last element which is the one caused by the registerServiceDependency call
        return provider;
    }

    describe("setServiceDependency", () => {
        test("should provide current client and set instance if bundle depends on the passed service", () => {
            const provider = registerTestServiceDep();
            const res = bundleManager.setServiceDependency(testBundle, "testInstance", testServiceInstance);

            expect(res.failed).toBe(false);
            // Make sure that the bundle got access to the current client of the instance
            expect(provider?.getClient()).toBe(testServiceInstance.client);
            expect(changeCb).toHaveBeenCalledTimes(1);
        });

        test("should error if bundle hasn't registered any service dependencies", () => {
            const res = bundleManager.setServiceDependency(testBundle, "testInstance", testServiceInstance);
            expect(res.failed).toBe(true);
            if (res.failed) {
                expect(res.errorMessage).toContain("couldn't be found");
            }
        });

        test("should error if bundle has service dependencies but not for this service", () => {
            // Here testBundle depends on testService and we try to set a instance for otherService
            // on which testBundle does not depend upon which should cause an error.
            registerTestServiceDep();
            const res = bundleManager.setServiceDependency(testBundle, "otherInstance", {
                serviceType: "otherService",
                client: undefined,
                config: undefined,
            });

            expect(res.failed).toBe(true);
            if (res.failed) {
                expect(res.errorMessage).toContain("doesn't depend on");
            }
            expect(changeCb).not.toHaveBeenCalled(); // No update when failed
        });

        test("should trigger re-registering handlers of previous service instance", () => {
            registerTestServiceDep();
            const reRegisterCb = jest.fn();
            bundleManager.on("reregisterInstance", reRegisterCb);

            bundleManager.setServiceDependency(testBundle, "testInstance", testServiceInstance);
            expect(reRegisterCb).toHaveBeenCalledWith(undefined);

            bundleManager.setServiceDependency(testBundle, "otherInstance", testServiceInstance);
            expect(reRegisterCb).toHaveBeenCalledWith("testInstance");
        });
    });

    describe("unsetServiceDependency", () => {
        test("should clear provided client and instance in service dependency if bundle depends on this service", () => {
            const provider = registerTestServiceDep();
            const res = bundleManager.unsetServiceDependency(testBundle, testService.serviceType);

            expect(res).toBe(true);
            expect(provider?.getClient()).toBeUndefined();
            expect(bundleManager.getBundleDependencies()[testBundle]?.[0]?.serviceInstance).toBeUndefined();
            expect(changeCb).toHaveBeenCalled();
        });

        test("should return false if bundle does not depend on the passed service", () => {
            registerTestServiceDep();

            const res = bundleManager.unsetServiceDependency(testBundle, "otherService");
            expect(res).toBe(false);
            expect(changeCb).not.toHaveBeenCalled();
        });

        test("should return false if bundle doesn't exists", () => {
            // Bundle has not registered any dependencies and is unknown to BundleManager
            const res = bundleManager.unsetServiceDependency(testBundle, testService.serviceType);
            expect(res).toBe(false);
            expect(changeCb).not.toHaveBeenCalled();
        });

        test("should trigger re-registering handlers of previous service instance", () => {
            registerTestServiceDep();
            const reRegisterCb = jest.fn();
            bundleManager.on("reregisterInstance", reRegisterCb);
            bundleManager.setServiceDependency(testBundle, "testInstance", testServiceInstance);

            bundleManager.unsetServiceDependency(testBundle, testService.serviceType);
            expect(reRegisterCb).toHaveBeenCalledWith("testInstance");
        });
    });

    describe("handleInstanceUpdate", () => {
        test("should update provided client if bundle is set to this service instance", () => {
            const provider = registerTestServiceDep();
            const cb = jest.fn();
            provider?.onAvailable(cb);
            bundleManager.setServiceDependency(testBundle, "testInstance", {
                ...testServiceInstance,
                client: undefined,
            });

            bundleManager.handleInstanceUpdate(testServiceInstance, "testInstance");
            expect(provider?.getClient()).toBe(testServiceInstance.client);
            expect(cb).toHaveBeenCalledTimes(1);
            expect(cb.mock.calls[0][0]).toStrictEqual(testServiceInstance.client);
        });

        test("should not update provided client if bundle depends on this service type but is not set to this instance", () => {
            const provider = registerTestServiceDep();
            const cb = jest.fn();
            provider?.onAvailable(cb);

            bundleManager.handleInstanceUpdate(testServiceInstance, "testInstance");
            expect(provider?.getClient()).toBe(undefined);
            expect(cb).not.toHaveBeenCalled();
        });
    });
});
