import { updateMonacoLayout } from "./serviceInstance";
import { setPassword, isPasswordSet } from "./crypto";

// HTML elements
const spanLoaded = document.getElementById("spanLoaded") as HTMLSpanElement;
const inputPassword = document.getElementById("inputPassword") as HTMLInputElement;
const divAuth = document.getElementById("divAuth");
const divMain = document.getElementById("divMain");
const spanPasswordNotice = document.getElementById("spanPasswordNotice") as HTMLSpanElement;
const pFirstStartup = document.getElementById("pFirstStartup");

// Add key listener to password input
inputPassword?.addEventListener("keyup", function (event) {
    if (event.keyCode === 13 || event.key === "Enter") {
        event.preventDefault();
        loadFramework();
    }
});

// Handler for when the socket.io client re-connects which is usually a NodeCG restart.
nodecg.socket.on("connect", () => {
    // Give NodeCG 200ms to fully connect, so everything is usable.
    setTimeout(() => {
        // If a password has been entered previously try to directly log in using it.
        if (inputPassword.value !== "") {
            loadFramework();
        } else {
            updateLoadedStatus();
            updateFirstStartupLabel();
        }
    }, 200);
});

document.addEventListener("DOMContentLoaded", () => {
    // Render loaded status for initial load
    updateLoadedStatus();
    updateFirstStartupLabel();
});

export async function isLoaded(): Promise<boolean> {
    return new Promise((resolve, _reject) => {
        nodecg.sendMessage("isLoaded", (_err, res: boolean) => resolve(res));
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

    if (await setPassword(password)) {
        spanPasswordNotice.innerText = "";
    } else {
        spanPasswordNotice.innerText = "The provided password isn't correct!";
        inputPassword.value = "";
    }

    updateLoadedStatus();
}

async function updateFirstStartupLabel(): Promise<void> {
    const isFirstStartup: boolean = await nodecg.sendMessage("isFirstStartup");
    if (isFirstStartup) {
        pFirstStartup?.classList.remove("hidden");
    } else {
        pFirstStartup?.classList.add("hidden");
    }
}
