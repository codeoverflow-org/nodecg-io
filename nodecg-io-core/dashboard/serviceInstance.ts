import * as monaco from "monaco-editor";
import {
    CreateServiceInstanceMessage,
    DeleteServiceInstanceMessage,
    UpdateInstanceConfigMessage,
} from "nodecg-io-core/extension/messageManager";
import { updateOptionsArr, updateOptionsMap } from "./utils/selectUtils";
import { objectDeepCopy } from "./utils/deepCopy";
import { config, sendAuthenticatedMessage } from "./crypto";
import { ObjectMap } from "../extension/service";

const editorDefaultText = "<---- Select a service instance to start editing it in here";
const editorCreateText = "<---- Create a new service instance on the left and then you can edit it in here";
const editorInvalidServiceText = "!!!!! Service of this instance couldn't be found.";
const editorNotConfigurableText = "----- This service cannot be configured.";

document.addEventListener("DOMContentLoaded", () => {
    config.onChange(() => {
        renderServices();
        renderInstances();
    });
});

// Inputs
const selectInstance = document.getElementById("selectInstance") as HTMLSelectElement;
const selectService = document.getElementById("selectService") as HTMLSelectElement;
const selectPreset = document.getElementById("selectPreset") as HTMLSelectElement;
const inputInstanceName = document.getElementById("inputInstanceName") as HTMLInputElement;

// Website areas
const instanceServiceSelector = document.getElementById("instanceServiceSelector");
const instancePreset = document.getElementById("instancePreset");
const instanceNameField = document.getElementById("instanceNameField");
const instanceEditButtons = document.getElementById("instanceEditButtons");
const instanceCreateButton = document.getElementById("instanceCreateButton");
const instanceMonaco = document.getElementById("instanceMonaco");
if (instanceMonaco === null) {
    throw new Error("Couldn't find instanceMonaco");
}
const editor = monaco.editor.create(instanceMonaco, {
    theme: "vs-dark",
});

const spanInstanceNotice = document.getElementById("spanInstanceNotice");
const buttonSave = document.getElementById("buttonSave");

// HTML Handlers

window.addEventListener("resize", () => {
    updateMonacoLayout();
});
export function updateMonacoLayout(): void {
    editor?.layout();
}

// Instance drop-down
export function onInstanceSelectChange(value: string): void {
    showNotice(undefined);
    switch (value) {
        case "new":
            showInMonaco(true, editorCreateText);
            setCreateInputs(true, false, true, false);
            inputInstanceName.value = "";
            break;
        case "select":
            showInMonaco(true, editorDefaultText);
            setCreateInputs(false, false, true, false);
            break;
        default:
            showConfig(value);
    }
}

function showConfig(instName: string) {
    const inst = config.data?.instances[instName];
    const service = config.data?.services.find((svc) => svc.serviceType === inst?.serviceType);

    if (!service) {
        showInMonaco(true, editorInvalidServiceText);
    } else if (service.requiresNoConfig) {
        showInMonaco(true, editorNotConfigurableText);
    } else {
        showInMonaco(false, inst?.config ?? {}, service?.schema);
    }

    setCreateInputs(false, true, !(service?.requiresNoConfig ?? false), service?.presets !== undefined);

    if (service?.presets) {
        renderPresets(service.presets);
    }
}

// Preset drop-down
export function selectInstanceConfigPreset(): void {
    const selectedPresetName = selectPreset.options[selectPreset.selectedIndex]?.value;
    if (!selectedPresetName) {
        return;
    }

    const instName = selectInstance.options[selectInstance.selectedIndex]?.value;
    if (!instName) {
        return;
    }

    const instance = config.data?.instances[instName];
    if (!instance) {
        return;
    }

    const service = config.data?.services.find((svc) => svc.serviceType === instance.serviceType);
    const presetValue = service?.presets?.[selectedPresetName] ?? {};

    showInMonaco(false, presetValue, service?.schema);
}

// Save button
export async function saveInstanceConfig(): Promise<void> {
    if (editor === undefined) {
        return;
    }
    showNotice(undefined);

    try {
        const instName = selectInstance.options[selectInstance.selectedIndex]?.value;
        const config = JSON.parse(editor.getValue());
        const msg: Partial<UpdateInstanceConfigMessage> = {
            config: config,
            instanceName: instName,
        };
        showNotice("Saving...");
        await sendAuthenticatedMessage("updateInstanceConfig", msg);
        showNotice("Successfully saved.");
    } catch (err) {
        nodecg.log.error(`Couldn't save instance config: ${err}`);
        showNotice(String(err));
    }
}

// Delete button
export async function deleteInstance(): Promise<void> {
    const msg: Partial<DeleteServiceInstanceMessage> = {
        instanceName: selectInstance.options[selectInstance.selectedIndex]?.value,
    };

    const deleted = await sendAuthenticatedMessage("deleteServiceInstance", msg);
    if (deleted) {
        selectServiceInstance("select");
    } else {
        nodecg.log.info(
            `Couldn't delete the instance "${msg.instanceName}" for some reason, please check the nodecg log`,
        );
    }
}

// Create button
export async function createInstance(): Promise<void> {
    showNotice(undefined);
    const service = selectService.options[selectService.options.selectedIndex]?.value;
    const name = inputInstanceName.value;

    const msg: Partial<CreateServiceInstanceMessage> = {
        serviceType: service,
        instanceName: name,
    };

    try {
        await sendAuthenticatedMessage("createServiceInstance", msg);
    } catch (e) {
        showNotice(String(e));
        return;
    }

    // Give the browser some time to create the new instance select option and to add them to the DOM
    setTimeout(() => {
        selectServiceInstance(name);
    }, 250);
}

// Render functions of Replicants

function renderServices() {
    if (!config.data) {
        return;
    }
    updateOptionsArr(
        selectService,
        config.data.services.map((svc) => svc.serviceType),
    );
}

function renderInstances() {
    if (!config.data) {
        return;
    }

    const previousSelected = selectInstance.options[selectInstance.selectedIndex]?.value || "select";

    // Render instances
    updateOptionsMap(selectInstance, config.data.instances);

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

function renderPresets(presets: ObjectMap<unknown>) {
    updateOptionsMap(selectPreset, presets);

    // Add "Select..." element that hints the user that he can use this select box
    // to choose a preset
    const selectHintOption = document.createElement("option");
    selectHintOption.innerText = "Select...";
    selectPreset.prepend(selectHintOption);
    selectPreset.selectedIndex = 0; // Select newly added hint
}

// Util functions

function selectServiceInstance(instanceName: string) {
    for (let i = 0; i < selectInstance.options.length; i++) {
        const opt = selectInstance.options[i];
        if (opt?.value === instanceName) {
            // If already selected a re-render monaco is not needed
            if (selectInstance.selectedIndex !== i) {
                selectInstance.selectedIndex = i;
                onInstanceSelectChange(instanceName);
            }
            break;
        }
    }
}

// Hides/unhides parts of the website based on the passed parameters
function setCreateInputs(
    createMode: boolean,
    instanceSelected: boolean,
    showSave: boolean,
    serviceHasPresets: boolean,
) {
    function setVisible(node: HTMLElement | null, visible: boolean) {
        if (visible && node?.classList.contains("hidden")) {
            node?.classList.remove("hidden");
        } else if (!visible && !node?.classList.contains("hidden")) {
            node?.classList.add("hidden");
        }
    }

    setVisible(instanceEditButtons, !createMode && instanceSelected);
    setVisible(instancePreset, !createMode && instanceSelected && serviceHasPresets);
    setVisible(instanceCreateButton, createMode);
    setVisible(instanceNameField, createMode);
    setVisible(instanceServiceSelector, createMode);
    setVisible(buttonSave, showSave);
}

export function showNotice(msg: string | undefined): void {
    if (spanInstanceNotice !== null) {
        spanInstanceNotice.innerText = msg !== undefined ? msg : "";
    }
}

function showInMonaco(
    readOnly: boolean,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: any,
    schema?: Record<string, unknown>,
): void {
    editor?.updateOptions({ readOnly });
    const type = typeof content === "object" ? "json" : "text";
    const contentStr = typeof content === "object" ? JSON.stringify(content, null, 4) : content;

    // JSON Schema stuff
    // Get rid of old models, as they have to be unique and we may add the same again
    monaco.editor.getModels().forEach((m) => m.dispose());

    // This model uri can be completely made up as long the uri in the schema matches with the one in the language model.
    const modelUri = monaco.Uri.parse(`mem://nodecg-io/selectedServiceSchema.json`);

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions(
        schema
            ? {
                  validate: true,
                  schemas: [
                      {
                          uri: modelUri.toString(),
                          fileMatch: [modelUri.toString()],
                          schema: objectDeepCopy(schema),
                      },
                  ],
              }
            : {
                  validate: false, // if not set we disable validation again.
                  schemas: [],
              },
    );

    editor?.setModel(monaco.editor.createModel(contentStr, type, schema ? modelUri : undefined));
}
