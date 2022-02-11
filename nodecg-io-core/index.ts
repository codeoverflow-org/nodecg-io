// Re-exports all important stuff from nodecg-io-core.
// This can be used by services and bundles to import everything by just using "nodecg-io-core" and they don't need to know paths
// or where the thing they want to import is located.
// You can obviously still provide the full path if you wish.
export type { ObjectMap, Service, ServiceDependency, ServiceInstance } from "./extension/service";
export * from "./extension/utils/result";
export * from "./extension/serviceBundle";
export * from "./extension/serviceProvider";
export * from "./extension/utils/logger";
