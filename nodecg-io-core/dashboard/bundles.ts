import { updateOptionsArr, updateOptionsMap } from "./utils/selectUtils";
import { SetServiceDependencyMessage } from "nodecg-io-core/extension/messageManager";
import { config, sendAuthenticatedMessage } from "./crypto";

document.addEventListener("DOMContentLoaded", () => {
    config.onChange(() => {
        renderBundles();
        renderInstanceSelector();
    });
});

// HTML Elements
const selectBundle = document.getElementById("selectBundle") as HTMLSelectElement;
const selectBundleDepTypes = document.getElementById("selectBundleDepType") as HTMLSelectElement;
const selectBundleInstance = document.getElementById("selectBundleInstance") as HTMLSelectElement;

function renderBundles() {
    if (!config.data) {
        return;
    }

    updateOptionsMap(selectBundle, config.data.bundles);

    renderBundleDeps();
}

export function renderBundleDeps(): void {
    if (!config.data) {
        return;
    }

    const bundle = selectBundle.options[selectBundle.selectedIndex]?.value;
    const bundleDependencies = config.data.bundles[bundle];
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
    if (!config.data) {
        return;
    }

    // Rendering options
    const serviceType = selectBundleDepTypes.options[selectBundleDepTypes.selectedIndex]?.value;
    const instances = [];

    for (const instName in config.data.instances) {
        if (!Object.prototype.hasOwnProperty.call(config.data.instances, instName)) {
            continue;
        }

        if (config.data.instances[instName]?.serviceType === serviceType) {
            instances.push(instName);
        }
    }
    updateOptionsArr(selectBundleInstance, instances);
    const noneOption = document.createElement("option");
    noneOption.innerText = "none";
    noneOption.value = "none";
    selectBundleInstance.prepend(noneOption);

    // Selecting option of current set instance
    const bundle = selectBundle.options[selectBundle.selectedIndex]?.value;
    const currentInstance = config.data.bundles[bundle]?.find((dep) => dep.serviceType === serviceType)
        ?.serviceInstance;
    let index = 0;
    for (let i = 0; i < selectBundleInstance.options.length; i++) {
        if (selectBundleInstance.options.item(i)?.value === currentInstance) {
            index = i;
            break;
        }
    }
    selectBundleInstance.selectedIndex = index;
}

export async function setSelectedServiceDependency(): Promise<void> {
    const bundle = selectBundle.options[selectBundle.selectedIndex]?.value;
    const instance = selectBundleInstance.options[selectBundleInstance.selectedIndex]?.value;
    const type = selectBundleDepTypes.options[selectBundleDepTypes.selectedIndex]?.value;

    await setServiceDependency(bundle, instance === "none" ? undefined : instance, type);
}

export function unsetAllBundleDependencies(): void {
    const bundles = config.data?.bundles;
    if (bundles === undefined) {
        return;
    }

    Object.keys(bundles).forEach((bundleName) => {
        const b = bundles[bundleName];
        b?.forEach((dep) => {
            setServiceDependency(bundleName, undefined, dep.serviceType);
        });
    });
}

async function setServiceDependency(bundle: string, instance: string | undefined, serviceType: string): Promise<void> {
    const msg: Partial<SetServiceDependencyMessage> = {
        bundleName: bundle,
        instanceName: instance,
        serviceType,
    };

    try {
        await sendAuthenticatedMessage("setServiceDependency", msg);
    } catch (err) {
        nodecg.log.error(err);
    }
}
