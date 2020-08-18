/// <reference types="nodecg/types/browser" />
/// <reference types="monaco-editor/monaco" />
import { ObjectMap, Service, ServiceInstance } from "nodecg-io-core/extension/types";
import {
    CreateServiceInstanceMessage,
    DeleteServiceInstanceMessage,
    UpdateInstanceConfigMessage,
} from "nodecg-io-core/extension/messageManager";
import { updateOptionsArr, updateOptionsMap } from "./utils/selectUtils";
import { objectDeepCopy } from "./utils/deepCopy";

const editorDefaultText = "<---- Select a service instance to start editing it in here";
const editorCreateText = "<---- Create a new service instance on the left and then you can edit it in here";

// Replicants from the core extension
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const services = nodecg.Replicant<Service<unknown, any>[]>("services");
const serviceInstances = nodecg.Replicant<ObjectMap<string, ServiceInstance<unknown, unknown>>>("serviceInstances");
document.addEventListener("DOMContentLoaded", () => {
    services.on("change", renderServices);
    serviceInstances.on("change", renderInstances);
});

// Inputs
const selectInstance = document.getElementById("selectInstance") as HTMLSelectElement;
const selectService = document.getElementById("selectService") as HTMLSelectElement;
const inputInstanceName = document.getElementById("inputInstanceName") as HTMLInputElement;

// Website areas
const instanceServiceSelector = document.getElementById("instanceServiceSelector");
const instanceNameField = document.getElementById("instanceNameField");
const instanceEditButtons = document.getElementById("instanceEditButtons");
const instanceCreateButton = document.getElementById("instanceCreateButton");
const instanceMonaco = document.getElementById("instanceMonaco");
let editor: monaco.editor.IStandaloneCodeEditor | undefined;

const spanInstanceNotice = document.getElementById("spanInstanceNotice");

// HTML Handlers

window.addEventListener("resize", () => {
    updateMonacoLayout();
});
export function updateMonacoLayout(): void {
    editor?.layout();
}

export function onMonacoReady(): void {
    if (instanceMonaco) {
        editor = monaco.editor.create(instanceMonaco, {
            theme: "vs-dark",
        });

        // Virtually selects the same instance option again to show the json/text in the editor.
        const selected = selectInstance.options[selectInstance.selectedIndex]?.value || "select";
        selectServiceInstance(selected);
    }
}

// Instance drop-down
export function onInstanceSelectChange(value: string): void {
    showError(undefined);
    switch (value) {
        case "new":
            editor?.updateOptions({
                readOnly: true,
            });
            editor?.setModel(monaco.editor.createModel(editorCreateText, "text"));
            setCreateInputs(true, false);
            inputInstanceName.value = "";
            break;
        case "select":
            editor?.updateOptions({
                readOnly: true,
            });
            editor?.setModel(monaco.editor.createModel(editorDefaultText, "text"));
            setCreateInputs(false, false);
            break;
        default:
            showConfig(value);
    }
}

function showConfig(value: string) {
    const inst = serviceInstances.value?.[value];
    const service = services.value?.find((svc) => svc.serviceType === inst?.serviceType);

    editor?.updateOptions({
        readOnly: false,
    });

    // Get rid of old models, as they have to be unique and we may add the same again
    monaco.editor.getModels().forEach((m) => m.dispose());

    // This model uri can be completely made up as long the uri in the schema matches with the one in the language model.
    const modelUri = monaco.Uri.parse(`mem://nodecg-io/${inst?.serviceType}.json`);
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: service?.schema !== undefined,
        schemas:
            service?.schema !== undefined
                ? [
                      {
                          uri: modelUri.toString(),
                          fileMatch: [modelUri.toString()],
                          schema: objectDeepCopy(service?.schema),
                      },
                  ]
                : [],
    });
    const model = monaco.editor.createModel(JSON.stringify(inst?.config || {}, null, 4), "json", modelUri);
    editor?.setModel(model);
    setCreateInputs(false, true);
}

// Save button
export function saveInstanceConfig(): void {
    if (editor === undefined) {
        return;
    }
    showError(undefined);

    try {
        const instName = selectInstance.options[selectInstance.selectedIndex].value;
        const config = JSON.parse(editor.getValue());
        const msg: UpdateInstanceConfigMessage = {
            config: config,
            instanceName: instName,
        };
        // noinspection JSIgnoredPromiseFromCall this actually doesn't always result in a Promise
        nodecg.sendMessage("updateInstanceConfig", msg, (err) => {
            if (err) {
                console.log(err);
                showError(err);
            }
        });
    } catch (err) {
        console.log(err);
        showError(err);
    }
}

// Delete button
export function deleteInstance(): void {
    const msg: DeleteServiceInstanceMessage = {
        instanceName: selectInstance.options[selectInstance.selectedIndex].value,
    };

    nodecg.sendMessage("deleteServiceInstance", msg).then((r) => {
        if (r) {
            selectServiceInstance("select");
        } else {
            console.log(
                `Couldn't delete the instance "${msg.instanceName}" for some reason, please check the nodecg log`,
            );
        }
    });
}

// Create button
export function createInstance(): void {
    const service = selectService.options[selectService.options.selectedIndex].value;
    const name = inputInstanceName.value;

    const msg: CreateServiceInstanceMessage = {
        serviceType: service,
        instanceName: name,
    };

    // noinspection JSIgnoredPromiseFromCall this actually doesn't always result in a Promise
    nodecg.sendMessage("createServiceInstance", msg, (err) => {
        if (err) {
            console.log(err);
        } else {
            // Give the browser some time to create the new instance select option and to add them to the DOM
            setTimeout(() => {
                selectServiceInstance(name);
            }, 250);
        }
    });
}

// Render functions of Replicants

function renderServices() {
    if (services.value === undefined) {
        return;
    }
    updateOptionsArr(
        selectService,
        services.value.map((svc) => svc.serviceType),
    );
}

function renderInstances() {
    if (serviceInstances.value === undefined) {
        return;
    }

    const previousSelected = selectInstance.options[selectInstance.selectedIndex]?.value || "select";

    // Render instances
    updateOptionsMap(selectInstance, serviceInstances.value);

    // Add new and select options
    const selectOption = document.createElement("option");
    selectOption.innerText = "Select...";
    selectOption.value = "select";
    selectInstance.prepend(selectOption);

    const newOption = document.createElement("option");
    newOption.innerText = "New...";
    newOption.value = "new";
    selectInstance.options.add(newOption);

    // Restore previous selection
    selectServiceInstance(previousSelected);
}

// Util functions

function selectServiceInstance(instanceName: string) {
    for (let i = 0; i < selectInstance.options.length; i++) {
        const opt = selectInstance.options[i];
        if (opt.value === instanceName) {
            selectInstance.selectedIndex = i;
            onInstanceSelectChange(instanceName);
            break;
        }
    }
}

// Hides/unhides parts of the website based on the passed parameters
function setCreateInputs(createMode: boolean, instanceSelected: boolean) {
    function setVisible(node: HTMLElement | null, visible: boolean) {
        if (visible && node?.classList.contains("hidden")) {
            node?.classList.remove("hidden");
        } else if (!visible && !node?.classList.contains("hidden")) {
            node?.classList.add("hidden");
        }
    }

    setVisible(instanceEditButtons, !createMode && instanceSelected);
    setVisible(instanceCreateButton, createMode);
    setVisible(instanceNameField, createMode);
    setVisible(instanceServiceSelector, createMode);
}

export function showError(msg: string | undefined): void {
    if (spanInstanceNotice !== null) {
        spanInstanceNotice.innerText = msg !== undefined ? msg : "";
    }
}
