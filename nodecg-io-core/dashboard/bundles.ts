/// <reference types="nodecg/types/browser" />

import { ObjectMap, ServiceDependency, ServiceInstance } from "nodecg-io-core/extension/types";
import { updateOptionsArr, updateOptionsMap } from "./utils/selectUtils.js";
import { SetServiceDependencyMessage } from "nodecg-io-core/extension/messageManager";

// Replicants
const serviceInstances = nodecg.Replicant<ObjectMap<string, ServiceInstance<unknown, unknown>>>("serviceInstances");
const bundles = nodecg.Replicant<ObjectMap<string, ServiceDependency<unknown>[]>>("bundles");

document.addEventListener("DOMContentLoaded", () => {
    bundles.on("change", renderBundles);
    serviceInstances.on("change", renderInstanceSelector);
});

// HTML Elements
const selectBundle = document.getElementById("selectBundle") as HTMLSelectElement;
const selectBundleDepTypes = document.getElementById("selectBundleDepType") as HTMLSelectElement;
const selectBundleInstance = document.getElementById("selectBundleInstance") as HTMLSelectElement;

function renderBundles() {
    if (bundles.value === undefined) {
        return;
    }

    updateOptionsMap(selectBundle, bundles.value);

    renderBundleDeps();
}

export function renderBundleDeps(): void {
    if (bundles.value === undefined) {
        return;
    }

    const bundle = selectBundle.options[selectBundle.selectedIndex].value;
    const bundleDependencies = bundles.value[bundle];
    if (bundleDependencies === undefined) {
        return;
    }

    updateOptionsArr(
        selectBundleDepTypes,
        bundleDependencies.map((dep) => dep.serviceType),
    );

    renderInstanceSelector();
}

export function renderInstanceSelector(): void {
    if (bundles.value === undefined) {
        return;
    }

    // Rendering options
    const serviceType = selectBundleDepTypes.options[selectBundleDepTypes.selectedIndex].value;
    const instances = ["none"];

    for (const instName in serviceInstances.value) {
        if (!serviceInstances.value.hasOwnProperty(instName)) {
            continue;
        }

        if (serviceInstances.value[instName]?.serviceType === serviceType) {
            instances.push(instName);
        }
    }
    updateOptionsArr(selectBundleInstance, instances);

    // Selecting option of current set instance
    const bundle = selectBundle.options[selectBundle.selectedIndex].value;
    const currentInstance = bundles.value[bundle]?.find((dep) => dep.serviceType === serviceType)?.serviceInstance;
    let index = 0;
    for (let i = 0; i < selectBundleInstance.options.length; i++) {
        if (selectBundleInstance.options.item(i)?.value === currentInstance) {
            index = i;
            break;
        }
    }
    selectBundleInstance.selectedIndex = index;
}

export function setServiceDependency(): void {
    const bundle = selectBundle.options[selectBundle.selectedIndex].value;
    const instance = selectBundleInstance.options[selectBundleInstance.selectedIndex].value;
    const type = selectBundleDepTypes.options[selectBundleDepTypes.selectedIndex].value;

    const msg: SetServiceDependencyMessage = {
        bundleName: bundle,
        instanceName: instance === "none" ? undefined : instance,
        serviceType: type,
    };

    // noinspection JSIgnoredPromiseFromCall only returnes undefined
    nodecg.sendMessage("setServiceDependency", msg, (err) => {
        if (err) {
            console.log(err);
        }
    });
}
