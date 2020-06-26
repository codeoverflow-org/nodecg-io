/// <reference types="nodecg/types/browser" />

import { LoadFrameworkMessage } from "nodecg-io-core/extension/messageManager";
import { updateMonacoLayout } from "./serviceInstance.js";

// HTML elements
const spanLoaded = document.getElementById("spanLoaded") as HTMLSpanElement;
const inputPassword = document.getElementById("inputPassword") as HTMLInputElement;
const divAuth = document.getElementById("divAuth");
const divMain = document.getElementById("divMain");
const spanPasswordNotice = document.getElementById("spanPasswordNotice");

// A hacky way to have a callback whenever nodecg restarts.
// On start the replicant will be declared, resulting in a call to the passed callback.
// Needed to show the framework as unloaded when nodecg gets restarted with the dashboard still running.
nodecg.Replicant("restart", { persistent: false }).on("declared", () => updateLoadedStatus());

document.addEventListener("DOMContentLoaded", () => {
    updateLoadedStatus();
});

function updateLoadedStatus(): void {
    nodecg.sendMessage("isLoaded", (_err, result) => {
        if (result) {
            spanLoaded.innerText = "Loaded";
            divAuth?.classList.add("hidden");
            divMain?.classList.remove("hidden");
            updateMonacoLayout();
        } else {
            spanLoaded.innerText = "Not loaded";
            divAuth?.classList.remove("hidden");
            divMain?.classList.add("hidden");
        }
    });
}

export function loadFramework(): void {
    const password = inputPassword.value;
    const msg: LoadFrameworkMessage = { password };

    // TODO: Password (and configs) shouldn't be sent over plaintext.
    nodecg.sendMessage("load", msg, (error) => {
        if (spanPasswordNotice !== null) {
            spanPasswordNotice.innerText = "";
        }

        if (error) {
            if (spanPasswordNotice !== null) {
                spanPasswordNotice.innerText = "The provided passwort isn't correct!";
            }
        } else {
            // Clear password input for security reasons.
            inputPassword.value = "";
            updateLoadedStatus();
        }
    });
}
