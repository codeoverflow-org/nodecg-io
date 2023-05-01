import { ObjectMap, ServiceInstance } from "../service";
import NodeCG from "@nodecg/types";
import { EventEmitter } from "events";

// The mock-nodecg package has a few problems like no typings and some unimplemented functions that are a dealbreaker for us.
// Since the NodeCG API isn't that big, we can simply write our own mock.
// We may upstream typings and fix some non-implemented stuff upstream in the future.
// But for now we use these mocks that we can easily change if we need something
// that mock-nodecg hasn't implemented yet.

export class MockNodeCG {
    constructor(
        public bundleName: string = "nodecg-io-core",
        public bundleConfig = {},
        public bundleVersion = "0.2.0",
    ) {}

    bundleGit = {
        branch: "main",
        hash: "e3dbf8d7233ca3fdb895e7b2be934cebc7494173",
        shortHash: "e3dbf8d",
    };

    Logger = MockLogger;
    log = new MockLogger();
    config = {
        host: "0.0.0.0",
        port: 9090,
        developer: false,
        baseURL: "localhost:9090",
        logging: {},
        sentry: {},
        login: {},
        exitOnUncaught: false,
        bundles: {},
    } as unknown as NodeCG.Config;

    sendMessage = jest.fn();
    sendMessageToBundle = jest.fn();
    listenFor = jest.fn();
    unlisten = jest.fn();

    // We don't care about the type that all replicants have. The user has to ensure that the type they provide
    // to the replicant method matches the actual content of the replicant.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private declaredReplicants: ObjectMap<ObjectMap<MockedReplicant<any>>> = {};
    Replicant<V>(
        name: string,
        namespaceOrOpts?: string | NodeCG.Replicant.OptionsWithDefault<V>,
        o?: NodeCG.Replicant.OptionsWithDefault<V>,
    ): MockedReplicant<V> {
        const namespace = typeof namespaceOrOpts === "string" ? namespaceOrOpts : this.bundleName;

        // Check if this replicant was already declared once and return it if found
        const cachedReplicant = this.declaredReplicants[namespace]?.[name];
        if (cachedReplicant) {
            return cachedReplicant;
        }

        // This replicant was not already declared and needs to be created.

        const opts = typeof namespaceOrOpts === "object" ? namespaceOrOpts : o;
        const newReplicant = new MockReplicant(this.log, name, namespace, opts ?? {}) as unknown as MockedReplicant<V>;

        const namespaceObj = this.declaredReplicants[namespace];
        if (namespaceObj === undefined) {
            this.declaredReplicants[namespace] = { [name]: newReplicant };
        } else {
            namespaceObj[name] = newReplicant;
        }

        return newReplicant;
    }

    readReplicant<V>(name: string): V;
    readReplicant<V>(name: string, namespace: string): V;
    readReplicant<V>(name: string, namespace?: string): V | undefined {
        return this.Replicant<V>(name, namespace).value;
    }

    getSocketIOServer = jest.fn();
    Router = jest.fn();
    mount = jest.fn();
    util = {
        authCheck: jest.fn(),
    };
    extensions = {};
}

class MockLogger {
    name: "logger";
    trace = jest.fn();
    debug = jest.fn();
    info = jest.fn();
    warn = jest.fn();
    error = jest.fn();
    replicants = jest.fn();
}

type MockedReplicant<V> = MockReplicant<V> & NodeCG.ServerReplicant<V>;

class MockReplicant<V> extends EventEmitter {
    _value: V | undefined = this.opts.defaultValue;
    revision = 0;

    constructor(
        public readonly log: NodeCG.Logger,
        public readonly name: string,
        public readonly namespace: string,
        public readonly opts: Partial<NodeCG.Replicant.OptionsWithDefault<V>>,
    ) {
        super();
    }

    get value() {
        // When no default value is provided this will need to return undefined even though the type does not allow undefined values.
        // Meaning this is not possible to be type safe because the NodeCG typings aren't completely correct.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this._value!;
    }

    set value(newValue: V) {
        const oldValue = this._value;
        this._value = newValue;
        this.emit("change", newValue, oldValue);
        this.revision++;
    }

    validate() {
        // We don't support JSON schema here, so we always say it is "valid".
        return true;
    }
}

export function mockNodeCG(): MockNodeCG & NodeCG.ServerAPI {
    return new MockNodeCG() as unknown as MockNodeCG & NodeCG.ServerAPI;
}

// Test objects

// These variables all contain a string of their name and are mainly
// used to ensure that there is no typo in them because the compiler will complain
// if you mistype them and there is no variable with the exact name.
export const testBundle = "testBundle";
export const testBundle2 = "testBundle2";
export const testInstance = "testInstance";
export const testInstance2 = "testInstance2";

export const testService = {
    serviceType: "test",
    validateConfig: jest.fn(),
    createClient: jest.fn(),
    stopClient: jest.fn(),
    removeHandlers: jest.fn(),
    reCreateClientToRemoveHandlers: false,
    requiresNoConfig: false,
    defaultConfig: "Default config text",
    // Very basic schema that only checks that the config is a string
    schema: {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "string",
    },
};

export const testServiceInstance: ServiceInstance<string, () => string> = {
    serviceType: testService.serviceType,
    config: "hello world",
    client: () => "hello world",
};
