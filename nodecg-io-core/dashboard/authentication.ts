/// <reference types="nodecg/types/browser" />

import { LoadFrameworkMessage } from "nodecg-io-core/extension/messageManager";
import { updateMonacoLayout } from "./serviceInstance.js";

// HTML elements
const spanLoaded = document.getElementById("spanLoaded") as HTMLSpanElement;
const inputPassword = document.getElementById("inputPassword") as HTMLInputElement;
const divAuth = document.getElementById("divAuth");
const divMain = document.getElementById("divMain");
const spanPasswordNotice = document.getElementById("spanPasswordNotice");

// Handler for when the socket.io client re-connects which is usually a nodecg restart.
nodecg.socket.on("connect", () => {
    // If a password has been entered previously try to directly login using it.
    if (inputPassword.value !== "") {
        loadFramework();
    } else {
        updateLoadedStatus();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    // Render loaded status for initial load
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

    nodecg.sendMessage("load", msg, (error) => {
        if (spanPasswordNotice !== null) {
            spanPasswordNotice.innerText = "";
        }

        if (error) {
            if (spanPasswordNotice !== null) {
                spanPasswordNotice.innerText = "The provided passwort isn't correct!";
            }
            inputPassword.value = "";
        } else {
            updateLoadedStatus();
        }
    });
}
