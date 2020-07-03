import fetch from "node-fetch";
import { KEY_MAPPING, MOUSE_MAPPING, MOUSEWHEEL_MAPPING } from "./mapping";
import { spawn } from "child_process";
import { onExit } from "@rauschma/stringio";

export type MouseButton = "left" | "middle" | "right" | "button4" | "button5";
export type ScrollDirection = "up" | "down" | "left" | "right";

export function getAHK(mode: "ahk" | "xdotool", host: string, port: number): AHK {
    switch (mode) {
        case "ahk": {
            return new HotkeylessAHK(host, port);
        }
        case "xdotool": {
            return new XdoTool(host, port);
        }
    }
}

/**
 * A service that allows to simulate mouse and keyboard input. There might
 * be different services such as AutoHotkey or xdotool in the background. You
 * can send raw commands to them or use the functions on this interface that
 * will translate to commands for underlying service.
 *
 * To see what key in the intermediate functions is mapped to which native key
 * see `KEY_MAPPING`
 */
export interface AHK {
    /**
     * Tests the connection to the service.
     */
    testConnection(): Promise<boolean>;

    /**
     * Sends a command to the underlying service whichever it is. You might
     * prefer `sendAHK` and `sendXD`.
     */
    sendCommand(command: string): Promise<void>;

    /**
     * Sends a command to the underlying service. If it's AutoHotkey, the
     * first parameter is sent. If it's xdotool the second parameter is sent.
     */
    sendEither(ahk: string, xdotool: string): Promise<void>;

    /**
     * Sends a command to AutoHotkey or rejects the promise if another service
     * is running in the background.
     */
    sendAHK(command: string): Promise<void>;

    /**
     * Sends a command to xdotool or rejects the promise if another service
     * is running in the background. The command should be like a shell
     * command without the preceding xdotool. (e.g. 'type Hello World')
     */
    sendXD(command: string): Promise<void>;

    /**
     * Simulates that the given text is typed on a keyboard.
     */
    type(text: string): Promise<void>;

    /**
     * Simulated the given key combination to be pressed. The string
     * is case insensitive. So when you wan't a capital 'A' you must
     * use 'Shift+A'. To see what string matches what key, see the
     * interface description.
     *
     * A key combination is a comma separated list of key actions.
     * A key action is a plus separated list of keys.
     *
     * For every key action the first key is pressed at first, then
     * the second and so on. Then they're released.
     *
     * All key actions are executed one after another.
     *
     * Examples:
     * 'Ctrl+A' => Press Ctrl, press A, release all
     * 'Ctrl+Alt+L,Ctrl+B' => Press Ctrl, press Shift, press L,
     *   release all, press Ctrl, press B, release all
     */
    key(keyCode: string): Promise<void>;

    /**
     * Simulates that the given key got pressed. To see what string
     * matches what key, see the interface description.
     */
    keydown(keyCode: string): Promise<void>;

    /**
     * Simulates that the given key got released. To see what string
     * matches what key, see the interface description.
     */
    keyup(keyCode: string): Promise<void>;

    /**
     * Simulates that the given mouse button was clicked.
     */
    mouse(button: MouseButton): Promise<void>;

    /**
     * Simulates that the given mouse button was pressed.
     */
    mousedown(button: MouseButton): Promise<void>;

    /**
     * Simulates that the given mouse button was released.
     */
    mouseup(button: MouseButton): Promise<void>;

    /**
     * Simulates a mouse scroll in the given direction.
     */
    scroll(direction: ScrollDirection): Promise<void>;

    /**
     * Moves the mouse pointer to the given coordinates on the screen.
     * @param relative Whether to move relative to the current pointer position
     */
    move(x: number, y: number, relative: boolean): Promise<void>;
}

function parseKey(key: string, down: (_: string) => void, up: (_: string) => void): void {
    key.split(",").forEach((action) => {
        const keys: Array<string> = action.split("+");
        keys.forEach(down);
        keys.reverse().forEach(up);
    });
}

function resolveAHKKey(mapping: Record<string, [string, string]> | null, key: string, mode?: "up" | "down"): string {
    let modeStr = "";
    if (mode != undefined) {
        modeStr = ` ${mode}`;
    }
    let mappingsKey = key.toLowerCase();
    if (mappingsKey != "_") {
        mappingsKey = mappingsKey.replace("_", "");
    }
    if (mapping != null && mappingsKey in mapping) {
        return `{${mapping[mappingsKey][0]}${modeStr}}`;
    } else if (key.length == 1) {
        return `{${key.toLowerCase()}${modeStr}}`;
    } else {
        return `{${key}${modeStr}}`;
    }
}

function resolveXDKey(mapping: Record<string, [string, string]> | null, key: string): string {
    let mappingsKey = key.toLowerCase();
    if (mappingsKey != "_") {
        mappingsKey = mappingsKey.replace("_", "");
    }
    if (mapping != null && mappingsKey in mapping) {
        return mapping[mappingsKey][1];
    } else if (key.length == 1) {
        return key.toLowerCase();
    } else {
        return key;
    }
}

class HotkeylessAHK {
    private readonly address: string;

    constructor(host: string, port: number) {
        this.address = `http://${host}:${port}`;
    }

    async testConnection(): Promise<boolean> {
        const response = await fetch(`${this.address}/nodecg-io`, { method: "GET" });
        return response.status === 404;
    }

    async sendAHK(command: string): Promise<void> {
        try {
            await fetch(`${this.address}/send/${command}`, { method: "GET" });
        } catch (err) {
            console.error(`Error while using the AHK Connector: ${err}`);
        }
    }

    sendCommand(command: string): Promise<void> {
        return this.sendAHK(command);
    }

    sendEither(ahk: string, _: string): Promise<void> {
        return this.sendAHK(ahk);
    }

    sendXD(_: string): Promise<void> {
        return Promise.reject("You attempted to send a xdotool command to AutoHotkey");
    }

    type(text: string): Promise<void> {
        return this.sendAHK(`send {Text} ${text}`);
    }

    key(keyCode: string): Promise<void> {
        let send = "send ";
        parseKey(
            keyCode,
            (key) => (send += resolveAHKKey(KEY_MAPPING, key, "down")),
            (key) => (send += resolveAHKKey(KEY_MAPPING, key, "up")),
        );
        return this.sendAHK(send);
    }

    keydown(keyCode: string): Promise<void> {
        let send = "send ";
        parseKey(
            keyCode,
            (key) => (send += resolveAHKKey(KEY_MAPPING, key, "down")),
            () => {},
        );
        return this.sendAHK(send);
    }

    keyup(keyCode: string): Promise<void> {
        let send = "send ";
        // The keys are handled in the 'down' argument although the method
        // is called keyup because in the up argument they'd be called
        // in reverse order.
        parseKey(
            keyCode,
            (key) => (send += resolveAHKKey(KEY_MAPPING, key, "up")),
            () => {},
        );
        return this.sendAHK(send);
    }

    mouse(button: MouseButton): Promise<void> {
        return this.sendAHK(`send ${resolveAHKKey(MOUSE_MAPPING, button)}`);
    }

    mousedown(button: MouseButton): Promise<void> {
        return this.sendAHK(`send ${resolveAHKKey(MOUSE_MAPPING, button, "down")}`);
    }

    mouseup(button: MouseButton): Promise<void> {
        return this.sendAHK(`send ${resolveAHKKey(MOUSE_MAPPING, button, "up")}`);
    }

    scroll(direction: ScrollDirection): Promise<void> {
        return this.sendAHK(`send ${resolveAHKKey(MOUSEWHEEL_MAPPING, direction)}`);
    }

    move(x: number, y: number, relative: boolean): Promise<void> {
        if (relative) {
            return this.sendAHK(`MouseMove, ${x}, ${y}, 0, R`);
        } else {
            return this.sendAHK(`MouseMove, ${x}, ${y}, 0`);
        }
    }
}

class XdoTool implements AHK {
    private readonly address: string | null;

    constructor(host: string, port: number) {
        if ((host.startsWith("127.0.0.") || host == "localhost") && port < 0) {
            this.address = null;
        } else {
            this.address = `http://${host}:${port}`;
        }
    }

    async testConnection(): Promise<boolean> {
        if (this.address == null) {
            const childProcess = spawn("xdotool", ["version"], {
                stdio: ["ignore", "ignore", process.stderr],
                //shell: true
                env: process.env,
            });
            await onExit(childProcess);
            if (childProcess.exitCode === 0) {
                // Success
                return true;
            } else if (childProcess.exitCode === 127) {
                // Not found
                throw new Error(`xdotool not found`);
            } else {
                return false;
            }
        } else {
            const response = await fetch(`${this.address}/nodecg-io`, { method: "GET" });
            return response.status === 404;
        }
    }

    async sendXD(command: string): Promise<void> {
        console.log(command);
        if (this.address == null) {
            const subcommands = command.split("\n");
            for (let i = 0; i < subcommands.length; i++) {
                const childProcess = spawn("xdotool", subcommands[i].split(" "), {
                    stdio: ["ignore", "ignore", process.stderr],
                    //shell: true
                    env: process.env,
                });
                await onExit(childProcess);
                if (childProcess.exitCode != 0) {
                    throw new Error(`xdotool returned error code ${childProcess.exitCode}`);
                }
            }
        } else {
            try {
                await fetch(`${this.address}/send/${command}`, { method: "GET" });
            } catch (err) {
                console.error(`Error while using the xdotool Connector: ${err}`);
            }
        }
    }

    sendCommand(command: string): Promise<void> {
        return this.sendXD(command);
    }

    sendEither(_: string, xdotool: string): Promise<void> {
        return this.sendXD(xdotool);
    }

    sendAHK(_: string): Promise<void> {
        return Promise.reject("You attempted to send an AutoHotkey command to xdotool");
    }

    type(text: string): Promise<void> {
        return this.sendXD(`type -- ${text}`);
    }

    key(keyCode: string): Promise<void> {
        let send = "";
        parseKey(
            keyCode,
            (key) => (send += `keydown -- ${resolveXDKey(KEY_MAPPING, key)} `),
            (key) => (send += `keyup -- ${resolveXDKey(KEY_MAPPING, key)} `),
        );
        return this.sendXD(send);
    }

    keydown(keyCode: string): Promise<void> {
        let send = "";
        parseKey(
            keyCode,
            (key) => (send += `keydown -- ${resolveXDKey(KEY_MAPPING, key)} `),
            () => {},
        );
        return this.sendXD(send);
    }

    keyup(keyCode: string): Promise<void> {
        let send = "";
        // The keys are handled in the 'down' argument although the method
        // is called keyup because in the up argument they'd be called
        // in reverse order.
        parseKey(
            keyCode,
            (key) => (send += `keyup -- ${resolveXDKey(KEY_MAPPING, key)} `),
            () => {},
        );
        return this.sendXD(send);
    }

    mouse(button: MouseButton): Promise<void> {
        const mouseButton = resolveXDKey(MOUSE_MAPPING, button);
        return this.sendXD(`mousedown -- ${mouseButton} mouseup -- ${mouseButton}`);
    }

    mousedown(button: MouseButton): Promise<void> {
        return this.sendXD(`mousedown -- ${resolveXDKey(MOUSE_MAPPING, button)}`);
    }

    mouseup(button: MouseButton): Promise<void> {
        return this.sendXD(`mouseup -- ${resolveXDKey(MOUSE_MAPPING, button)}`);
    }

    scroll(direction: ScrollDirection): Promise<void> {
        const mouseButton = resolveXDKey(MOUSEWHEEL_MAPPING, direction);
        return this.sendXD(`mousedown -- ${mouseButton} mouseup -- ${mouseButton}`);
    }

    move(x: number, y: number, relative: boolean): Promise<void> {
        if (relative) {
            return this.sendXD(`mousemove_relative --sync -- ${x} ${y}`);
        } else {
            return this.sendXD(`mousemove --sync -- ${x} ${y}`);
        }
    }
}
