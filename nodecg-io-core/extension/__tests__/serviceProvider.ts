import { NodeCGIOCore } from "..";
import { requireService, ServiceProvider } from "../serviceProvider";
import { MockNodeCG } from "./mocks";

describe("ServiceProvider", () => {
    test("client should be undefined after construction", () => {
        const provider = new ServiceProvider();
        expect(provider.getClient()).toBeUndefined();
    });

    test("returns correct client after updating it", () => {
        const provider = new ServiceProvider();

        provider.updateClient("hello");
        expect(provider.getClient()).toBe("hello");

        provider.updateClient(undefined);
        expect(provider.getClient()).toBeUndefined();
    });

    test("updating the client with undefined should trigger unavailable handlers", () => {
        const provider = new ServiceProvider();
        const available = jest.fn();
        const unavailable = jest.fn();
        provider.onAvailable(available);
        provider.onUnavailable(unavailable);

        provider.updateClient(undefined);

        expect(available).not.toHaveBeenCalled();
        expect(unavailable).toHaveBeenCalledTimes(1);
    });

    test("updating the client with a truthy value should trigger available handlers", () => {
        const provider = new ServiceProvider();
        const available = jest.fn();
        const unavailable = jest.fn();
        provider.onAvailable(available);
        provider.onUnavailable(unavailable);

        provider.updateClient("hello");

        expect(available).toHaveBeenCalledWith("hello");
        expect(unavailable).not.toHaveBeenCalled();
    });
});

describe("requireService", () => {
    test("should log error and return undefined if core not loaded", () => {
        // MockNodeCG by default has extensions set to a empty object, meaning core was not loaded by nodecg
        const nodecg = new MockNodeCG();
        const result = requireService(nodecg, "test");

        expect(result).toBeUndefined();
        expect(nodecg.log.error).toHaveBeenCalled(); // Ensure that a error is logged and bundles don't need to do it
    });

    test("should call requireService on core if core is loaded", () => {
        const core: NodeCGIOCore = {
            registerService: jest.fn(),
            requireService: jest.fn(),
        };

        const nodecg = new MockNodeCG();
        nodecg.extensions = { "nodecg-io-core": core };

        requireService(nodecg, "test");
        expect(core.requireService).toHaveBeenCalledWith(nodecg, "test"); // should pass nodecg and name param
    });
});
