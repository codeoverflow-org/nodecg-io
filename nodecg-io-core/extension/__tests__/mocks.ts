import { ObjectMap, Service, ServiceInstance } from "../service";
import type { NodeCG, ReplicantOptions, Replicant, Logger } from "nodecg/types/server";
import { EventEmitter } from "events";

// The mock-nodecg package has a few problems like no typings and some un-implemented functions that are a dealbreaker for us.
// Since the nodecg api isn't that big we can simply write our own mock.
// We may upstream typings and fix some non-implemented stuff upstream in the future.
// But for now we use these mocks that we can easily change if we need something
// that mock-nodecg hasn't implemented yet.

export class MockNodeCG implements NodeCG {
    constructor(
        public bundleName: string = "nodecg-io-core",
        public bundleConfig = {},
        public bundleVersion = "0.2.0",
    ) {}

    bundleGit = {
        branch: "master",
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
    };

    sendMessage = jest.fn();
    sendMessageToBundle = jest.fn();
    listenFor = jest.fn();
    unlisten = jest.fn();

    // We don't care about the type that all replicants have. The user has to ensure that the type they provide
    // to the Replicant method matches the actual content of the replicant.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private declaredReplicants: ObjectMap<ObjectMap<Replicant<any>>> = {};
    Replicant<V>(name: string, namespaceOrOpts?: string | ReplicantOptions<V>, o?: ReplicantOptions<V>): Replicant<V> {
        const namespace = typeof namespaceOrOpts === "string" ? namespaceOrOpts : this.bundleName;

        // Check if this replicant was already declared once and return it if found
        const cachedReplicant = this.declaredReplicants[namespace]?.[name];
        if (cachedReplicant) {
            return cachedReplicant;
        }

        // This replicant was not already declared and needs to be created.

        const opts = typeof namespaceOrOpts === "object" ? namespaceOrOpts : o;
        const newReplicant = new MockReplicant(this.log, name, namespace, opts ?? {});

        const namespaceObj = this.declaredReplicants[namespace];
        if (namespaceObj === undefined) {
            this.declaredReplicants[namespace] = { [name]: newReplicant };
        } else {
            namespaceObj[name] = newReplicant;
        }

        return newReplicant;
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
    trace = jest.fn();
    debug = jest.fn();
    info = jest.fn();
    warn = jest.fn();
    error = jest.fn();
    replicants = jest.fn();
    static globalReconfigure = jest.fn();
}

class MockReplicant<V> extends EventEmitter implements Replicant<V> {
    private _value: V | undefined = this.opts.defaultValue;
    revision = 0;

    constructor(
        public readonly log: Logger,
        public readonly name: string,
        public readonly namespace: string,
        public readonly opts: ReplicantOptions<V>,
    ) {
        super();
    }

    get value() {
        // When no default value is provided this will need to return undefined even though the type does not allow undefined values.
        // Meaning this is not possible to be type safe because the nodecg typings aren't completely correct.
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
        // We don't support json schema here, so we always say it is "valid".
        return true;
    }
}

// Test objects

export const testBundle = "testBundle";

export const testService: Service<string, () => string> = {
    serviceType: "test",
    validateConfig: jest.fn(),
    createClient: jest.fn(),
    stopClient: jest.fn(),
    reCreateClientToRemoveHandlers: false,
    requiresNoConfig: false,
};

export const testServiceInstance: ServiceInstance<string, () => string> = {
    serviceType: testService.serviceType,
    config: "hello world",
    client: () => "hello world",
};
