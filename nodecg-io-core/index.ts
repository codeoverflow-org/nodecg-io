// Re-exports all important stuff from nodecg-io-core.
// This can be used by services and bundles to import everything by just using "nodecg-io-core" and they don't need to know paths
// or where the thing they want to import is located.
// You can obviously still provide the full path if you wish.
export type { ObjectMap, Service, ServiceDependency, ServiceInstance } from "./extension/types";
export * from "./extension/utils/result";
export { ServiceBundle } from "./extension/serviceBundle";
export { requireService, ServiceProvider } from "./extension/serviceProvider";
