/// <reference types="nodecg/types/browser" />
/// <reference types="monaco-editor/monaco" />
import { ObjectMap, Service, ServiceInstance } from "nodecg-io-core/extension/types";
import {
    CreateServiceInstanceMessage,
    DeleteServiceInstanceMessage,
    UpdateInstanceConfigMessage
} from "nodecg-io-core/extension/messageManager";
import { updateOptionsArr, updateOptionsMap } from "./utils/selectUtils.js";

const editorDefaultText = "<---- Select a service instance to start editing it in here";
const editorCreateText = "<---- Create a new service instance on the left and then you can edit it in here";

// Replicants from the core extension
const services = nodecg.Replicant<Service<unknown, unknown>[]>("services");
const serviceInstances = nodecg.Replicant<ObjectMap<string, ServiceInstance<unknown, unknown>>>("serviceInstances");
document.addEventListener("DOMContentLoaded", () => {
    services.on("change", renderServices);
})

// Inputs
const selectInstance = document.getElementById("selectInstance") as HTMLSelectElement;
const selectService = document.getElementById("selectService") as HTMLSelectElement;
const inputInstanceName = document.getElementById("inputInstanceName") as HTMLInputElement;

// Website areas
const instanceServiceSelector = document.getElementById("instanceServiceSelector");
const instanceNameField = document.getElementById("instanceNameField");
const instanceEditButtons = document.getElementById("instanceEditButtons");
const instanceCreateButton = document.getElementById("instanceCreateButton");
let editor: monaco.editor.IStandaloneCodeEditor | undefined;

// HTML Handlers

// When monaco-editor module has been loaded
export function onMonacoReady() {
    editor = monaco.editor.create(document.getElementById("instanceMonaco")!, {
        theme: "vs-dark"
    });
    // Render Instances calls selectServiceInstance, which needs monaco. Thats why it is registered after monaco has been loaded.
    serviceInstances.on("change", renderInstances);
}

// Instance drop-down
export function onInstanceSelectChange(value: string) {
    switch (value) {
        case "new":
            editor?.updateOptions({
                readOnly: true
            });
            editor?.setModel(monaco.editor.createModel(editorCreateText, "text"));
            setCreateInputs(true, false);
            inputInstanceName.value = "";
            break;
        case "select":
            editor?.updateOptions({
                readOnly: true
            });
            editor?.setModel(monaco.editor.createModel(editorDefaultText, "text"));
            setCreateInputs(false, false);
            break;
        default:
            // TODO: add schema to monaco
            const inst = serviceInstances.value?.[value];
            editor?.updateOptions({
                readOnly: false
            });
            editor?.setModel(monaco.editor.createModel(JSON.stringify(inst?.config || {}, null, 4), "json"));
            setCreateInputs(false, true);
    }
}

// Save button
export function saveInstanceConfig() {
    if (editor === undefined) {
        return;
    }

    try {
        const instName = selectInstance.options[selectInstance.selectedIndex].value;
        const config = JSON.parse(editor.getValue());
        const msg: UpdateInstanceConfigMessage = {
            config: config,
            instanceName: instName
        };
        // noinspection JSIgnoredPromiseFromCall this actually doesn't always result in a Promise
        nodecg.sendMessage("updateInstanceConfig", msg, (err) => {
            if (err) {
                console.log(err);
            }
        });
    } catch (e) {
        // TODO: show error in ui
        console.log(e);
    }
}

// Delete button
export function deleteInstance() {
    const msg: DeleteServiceInstanceMessage = {
        instanceName: selectInstance.options[selectInstance.selectedIndex].value
    };

    nodecg.sendMessage("deleteServiceInstance", msg)
        .then(r => {
            if (r) {
                selectServiceInstance("select");
            } else {
                console.log(`Couldn't delete the instance "${msg.instanceName}" for some reason, please check the nodecg log`);
            }
        });
}

// Create button
export function createInstance() {
    const service = selectService.options[selectService.options.selectedIndex].value;
    const name = inputInstanceName.value;

    const msg: CreateServiceInstanceMessage = {
        serviceType: service,
        instanceName: name
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
    if(services.value === undefined) {
        return;
    }
    updateOptionsArr(selectService, services.value.map(svc => svc.serviceType));
}

function renderInstances() {
    if(serviceInstances.value === undefined) {
        return;
    }

    const previousSelected = selectInstance.options[selectInstance.selectedIndex]?.value || "select";

    // Render instances
    updateOptionsMap(selectInstance, serviceInstances.value)

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


