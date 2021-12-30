// Re-export functions that are used in panel.html to the global scope
import { loadFramework } from "./authentication";
import {
    onInstanceSelectChange,
    createInstance,
    saveInstanceConfig,
    deleteInstance,
    selectInstanceConfigPreset,
} from "./serviceInstance";
import {
    renderBundleDeps,
    renderInstanceSelector,
    setSelectedServiceDependency,
    unsetAllBundleDependencies,
} from "./bundles";

interface nodecgio extends Window {
    nodecgio: {
        loadFramework: typeof loadFramework;
        onInstanceSelectChange: typeof onInstanceSelectChange;
        createInstance: typeof createInstance;
        saveInstanceConfig: typeof saveInstanceConfig;
        deleteInstance: typeof deleteInstance;
        selectInstanceConfigPreset: typeof selectInstanceConfigPreset;
        renderBundleDeps: typeof renderBundleDeps;
        renderInstanceSelector: typeof renderInstanceSelector;
        setSelectedServiceDependency: typeof setSelectedServiceDependency;
        unsetAllBundleDependencies: typeof unsetAllBundleDependencies;
    };
}

(window as nodecgio & typeof globalThis).nodecgio = {
    loadFramework,
    onInstanceSelectChange,
    createInstance,
    saveInstanceConfig,
    deleteInstance,
    selectInstanceConfigPreset,
    renderBundleDeps,
    renderInstanceSelector,
    setSelectedServiceDependency,
    unsetAllBundleDependencies,
};
