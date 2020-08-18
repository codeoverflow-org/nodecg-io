/// <reference types="nodecg/types/browser" />

import { LoadFrameworkMessage } from "nodecg-io-core/extension/messageManager";
import { updateMonacoLayout } from "./serviceInstance";
import { setPassword, isPasswordSet, encryptedData as encryptedDataReplicant } from "./crypto";

// HTML elements
const spanLoaded = document.getElementById("spanLoaded") as HTMLSpanElement;
const inputPassword = document.getElementById("inputPassword") as HTMLInputElement;
const divAuth = document.getElementById("divAuth");
const divMain = document.getElementById("divMain");
const spanPasswordNotice = document.getElementById("spanPasswordNotice");

// Add key listener to password input
inputPassword?.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        loadFramework();
    }
});

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

async function isLoaded(): Promise<boolean> {
    return new Promise((resolve, _reject) => {
        nodecg.sendMessage("isLoaded", (_err, res) => resolve(res));
        setTimeout(() => resolve(false), 5000); // Fallback in case connection gets lost.
    });
}

async function updateLoadedStatus(): Promise<void> {
    const loaded = await isLoaded();
    if (loaded) {
        spanLoaded.innerText = "Loaded";
    } else {
        spanLoaded.innerText = "Not loaded";
    }

    const loggedIn = loaded && isPasswordSet();
    if (loggedIn) {
        divAuth?.classList.add("hidden");
        divMain?.classList.remove("hidden");
        updateMonacoLayout();
    } else {
        divAuth?.classList.remove("hidden");
        divMain?.classList.add("hidden");
    }
}

export async function loadFramework(): Promise<void> {
    const password = inputPassword.value;
    const msg: LoadFrameworkMessage = { password };

    // We first load nodecg-io if needed because it may need to generate a config if
    // this is the first start and that way we don't need to handle the case of an nonexistant config.

    // If nodecg-io has been already loaded we don't need to do it again and it would return an error.
    if (!(await isLoaded())) {
        nodecg.sendMessage("load", msg, (error) => {
            if (spanPasswordNotice !== null) {
                spanPasswordNotice.innerText = "";
            }

            if (error) {
                wrongPassword();
                return;
            }
        });
    }

    // Ensures that the encrypteDataReplicant has been declared because it is needed by setPassword()
    // This is especially needed when handling a reconnect as the replicant takes time to declare
    // and the password check is usually faster than that.
    await NodeCG.waitForReplicants(encryptedDataReplicant);

    // If the framework was already loaded then this check actually checks the password.
    // If the above if was entered this just sets it because we assume that the password didn't change.
    if (!setPassword(password)) {
        wrongPassword();
    }

    updateLoadedStatus();
}

function wrongPassword() {
    if (spanPasswordNotice !== null) {
        spanPasswordNotice.innerText = "The provided passwort isn't correct!";
    }
    inputPassword.value = "";
}
