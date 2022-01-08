import { DBusClient, DBusProxyConfig, DBusObject } from "./dbusClient";
import { ProxyObject, ClientInterface, Variant } from "dbus-next";

/**
 * Access to ratbagd.
 */
export class RatBagManager extends DBusObject {
    static readonly PROXY: DBusProxyConfig<RatBagManager> = {
        iface: "org.freedesktop.ratbag1",
        path: "/org/freedesktop/ratbag1",
        system: true,
        create(client: DBusClient, proxy: ProxyObject): RatBagManager {
            return new RatBagManager(client, proxy);
        },
    };

    constructor(client: DBusClient, proxy: ProxyObject) {
        super(client, proxy);
    }

    /**
     * Gets the API version of ratbagd. This is built for API 1. Everything else might not work as intended.
     */
    public async api(): Promise<number> {
        return (await this.getProperty("org.freedesktop.ratbag1.Manager", "APIVersion")).value;
    }

    /**
     * Gets a list of all currently connected devices.
     */
    public async devices(): Promise<RatBagDevice[]> {
        const variant = await this.getProperty("org.freedesktop.ratbag1.Manager", "Devices");
        const paths: string[] = variant.value;
        const devices: RatBagDevice[] = [];
        for (const path of paths) {
            const proxy = await this.proxy.bus.getProxyObject("org.freedesktop.ratbag1", path);
            devices.push(new RatBagDevice(this.client, proxy));
        }
        return devices;
    }
}

/**
 * A device, ratbagd can control.
 */
export class RatBagDevice extends DBusObject {
    private readonly device: RatBagDeviceInterface;

    constructor(client: DBusClient, proxy: ProxyObject) {
        super(client, proxy);
        this.device = proxy.getInterface("org.freedesktop.ratbag1.Device") as RatBagDeviceInterface;
    }

    /**
     * Gets the device name.
     */
    public async name(): Promise<string> {
        return (await this.getProperty("org.freedesktop.ratbag1.Device", "Name")).value;
    }

    /**
     * Gets the device model
     */
    public async model(): Promise<RatBagModel> {
        let modelString: string = (await this.getProperty("org.freedesktop.ratbag1.Device", "Model")).value;
        try {
            const busType: string = modelString.substring(0, modelString.indexOf(":"));
            modelString = modelString.substring(modelString.indexOf(":") + 1);
            if (busType !== "usb" && busType !== "bluetooth") {
                // We don't know about that bus type.
                return { busType: "unknown" };
            }
            const vendorHex = modelString.substring(0, modelString.indexOf(":"));
            modelString = modelString.substring(modelString.indexOf(":") + 1);
            const productHex = modelString.substring(0, modelString.indexOf(":"));
            modelString = modelString.substring(modelString.indexOf(":") + 1);
            const vendorId = parseInt(vendorHex, 16);
            const productId = parseInt(productHex, 16);
            const version = parseInt(modelString);
            if (isNaN(vendorId) || isNaN(productId) || isNaN(version)) {
                return { busType: "unknown" };
            }
            return {
                busType: busType,
                vendorHex: vendorHex,
                vendorId: vendorId,
                productHex: productHex,
                productId: productId,
                version: version,
            };
        } catch (err) {
            return { busType: "unknown" };
        }
    }

    /**
     * Gets a list of profiles for that device. If a device does not support multiple profiles,
     * there'll be just one profile in the list that can be used.
     */
    public async profiles(): Promise<RatBagProfile[]> {
        const variant = await this.getProperty("org.freedesktop.ratbag1.Device", "Profiles");
        const paths: string[] = variant.value;
        const profiles: RatBagProfile[] = [];
        for (const path of paths) {
            const proxy = await this.proxy.bus.getProxyObject("org.freedesktop.ratbag1", path);
            profiles.push(new RatBagProfile(this.client, proxy));
        }
        return profiles;
    }

    /**
     * Writes all changes that were made to the device.
     */
    public async commit(): Promise<void> {
        await this.device.Commit();
    }

    /**
     * Adds a listener for an event, when committing to the device fails.
     */
    public on(event: "Resync", handler: () => void): void {
        this.device.on(event, handler);
    }

    public once(event: "Resync", handler: () => void): void {
        this.device.once(event, handler);
    }

    public off(event: "Resync", handler: () => void): void {
        this.device.off(event, handler);
    }
}

/**
 * A profile for a ratbagd device.
 */
export class RatBagProfile extends DBusObject {
    private readonly profile: RatBagProfileInterface;

    constructor(client: DBusClient, proxy: ProxyObject) {
        super(client, proxy);
        this.profile = proxy.getInterface("org.freedesktop.ratbag1.Profile") as RatBagProfileInterface;
    }

    /**
     * Gets the index of the profile.
     */
    public async index(): Promise<number> {
        return (await this.getProperty("org.freedesktop.ratbag1.Profile", "Index")).value;
    }

    /**
     * Gets the name of the profile, if the device supports profile naming.
     */
    public async name(): Promise<string | undefined> {
        const name = (await this.getProperty("org.freedesktop.ratbag1.Profile", "Name")).value;
        return name === "" ? undefined : name;
    }

    /**
     * Sets the name of a profile. This must not be called if the device does not support profile naming.
     * Use {@link name()} first, to find out whether you can use this.
     */
    public async setName(name: string): Promise<void> {
        await this.setProperty("org.freedesktop.ratbag1.Profile", "Name", new Variant<string>("s", name));
    }

    /**
     * Gets whether the profile is enabled. A disabled profile may have invalid values set, so you should
     * check these values before enabling a profile.
     */
    public async enabled(): Promise<boolean> {
        return (await this.getProperty("org.freedesktop.ratbag1.Profile", "Enabled")).value;
    }

    /**
     * Enables this profile.
     */
    public async enable(): Promise<void> {
        await this.setProperty("org.freedesktop.ratbag1.Profile", "Enabled", new Variant<boolean>("b", true));
    }

    /**
     * Disables this profile.
     */
    public async disable(): Promise<void> {
        await this.setProperty("org.freedesktop.ratbag1.Profile", "Enabled", new Variant<boolean>("b", false));
    }

    /**
     * Gets whether this profile is currently active. There is always only one active profile.
     */
    public async active(): Promise<boolean> {
        return (await this.getProperty("org.freedesktop.ratbag1.Profile", "IsActive")).value;
    }

    /**
     * Activates this profile. The currently active profile will be deactivated.
     */
    public async activate(): Promise<void> {
        return await this.profile.SetActive();
    }

    /**
     * Gets a list of display resolutions, that can be switched through.
     */
    public async resolutions(): Promise<RatBagResolution[]> {
        const variant = await this.getProperty("org.freedesktop.ratbag1.Profile", "Resolutions");
        const paths: string[] = variant.value;
        const resolutions: RatBagResolution[] = [];
        for (const path of paths) {
            const proxy = await this.proxy.bus.getProxyObject("org.freedesktop.ratbag1", path);
            resolutions.push(new RatBagResolution(this.client, proxy));
        }
        return resolutions;
    }

    /**
     * Gets a list of buttons on the device for this profile.
     */
    public async buttons(): Promise<RatBagButton[]> {
        const variant = await this.getProperty("org.freedesktop.ratbag1.Profile", "Buttons");
        const paths: string[] = variant.value;
        const buttons: RatBagButton[] = [];
        for (const path of paths) {
            const proxy = await this.proxy.bus.getProxyObject("org.freedesktop.ratbag1", path);
            buttons.push(new RatBagButton(this.client, proxy));
        }
        return buttons;
    }

    /**
     * Gets a list of leds on the device for this profile.
     */
    public async leds(): Promise<RatBagLed[]> {
        const variant = await this.getProperty("org.freedesktop.ratbag1.Profile", "Leds");
        const paths: string[] = variant.value;
        const leds: RatBagLed[] = [];
        for (const path of paths) {
            const proxy = await this.proxy.bus.getProxyObject("org.freedesktop.ratbag1", path);
            leds.push(new RatBagLed(this.client, proxy));
        }
        return leds;
    }
}

/**
 * A resolution profile for a device profile.
 */
export class RatBagResolution extends DBusObject {
    private readonly resolution: RatBagResolutionInterface;

    constructor(client: DBusClient, proxy: ProxyObject) {
        super(client, proxy);
        this.resolution = proxy.getInterface("org.freedesktop.ratbag1.Resolution") as RatBagResolutionInterface;
    }

    /**
     * Gets the index of this resolution profile.
     */
    public async index(): Promise<number> {
        return (await this.getProperty("org.freedesktop.ratbag1.Resolution", "Index")).value;
    }

    /**
     * Gets whether this resolution profile is the currently active resolution.
     */
    public async active(): Promise<boolean> {
        return (await this.getProperty("org.freedesktop.ratbag1.Resolution", "IsActive")).value;
    }

    /**
     * Gets whether this resolution profile is the default.
     */
    public async default(): Promise<boolean> {
        return (await this.getProperty("org.freedesktop.ratbag1.Resolution", "IsDefault")).value;
    }

    /**
     * Sets this resolution profile as the currently active resolution.
     */
    public async activate(): Promise<void> {
        await this.resolution.SetActive();
    }

    /**
     * Sets this resolution profile as default.
     */
    public async setDefault(): Promise<void> {
        await this.resolution.SetDefault();
    }

    /**
     * Gets the dpi values for this profile.
     */
    public async dpi(): Promise<RatBagDpi> {
        const dpi: number | [number, number] = (
            await this.getProperty("org.freedesktop.ratbag1.Resolution", "Resolution")
        ).value;
        if (typeof dpi === "number") {
            return dpi;
        } else {
            return {
                x: dpi[0],
                y: dpi[1],
            };
        }
    }

    /**
     * Sets the dpi for this profile. If {@link dpi()} returns a single value, this must also be set to a single value.
     * If {@link dpi()} returns separate x and y values, this must be set to separate x and y values.
     */
    public async setDpi(dpi: RatBagDpi): Promise<void> {
        const variant =
            typeof dpi === "number"
                ? new Variant<number>("u", dpi)
                : new Variant<[number, number]>("(uu)", [dpi.x, dpi.y]);
        await this.setProperty("org.freedesktop.ratbag1.Resolution", "Resolution", variant);
    }

    /**
     * Gets a list of numbers that can be used as dpi values.
     */
    public async allowedDpiValues(): Promise<number[]> {
        return (await this.getProperty("org.freedesktop.ratbag1.Resolution", "Resolutions")).value;
    }
}

/**
 * A button on a device for a specific profile
 */
export class RatBagButton extends DBusObject {
    private static readonly SPECIAL_ACTION_MAP: Record<RatBagSpecialAction, number> = {
        "unknown": 0x40000000,
        "doubleclick": 0x40000001,
        "wheel left": 0x40000002,
        "wheel right": 0x40000003,
        "wheel up": 0x40000004,
        "wheel down": 0x40000005,
        "ratched mode switch": 0x40000006,
        "resolution cycle up": 0x40000007,
        "resolution cycle down": 0x40000008,
        "resolution up": 0x40000009,
        "resolution down": 0x4000000a,
        "resolution alternate": 0x4000000b,
        "resolution default": 0x4000000c,
        "profile cycle up": 0x4000000d,
        "profile cycle down": 0x4000000e,
        "profile up": 0x4000000f,
        "profile down": 0x40000010,
        "second mode": 0x40000011,
        "battery level": 0x40000012,
    };

    constructor(client: DBusClient, proxy: ProxyObject) {
        super(client, proxy);
    }

    /**
     * Gets the index of this button.
     */
    public async index(): Promise<number> {
        return (await this.getProperty("org.freedesktop.ratbag1.Button", "Index")).value;
    }

    /**
     * Gets the action currently bound to this button.
     */
    public async mapping(): Promise<RatBagMapping> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw: [number, Variant] = (await this.getProperty("org.freedesktop.ratbag1.Button", "Mapping")).value;
        if (raw[0] === 0) {
            return {
                type: "none",
            };
        } else if (raw[0] === 1) {
            return {
                type: "button",
                button: raw[1].value,
            };
        } else if (raw[0] === 2) {
            const id = Object.keys(RatBagButton.SPECIAL_ACTION_MAP).find(
                (key) => RatBagButton.SPECIAL_ACTION_MAP[key as RatBagSpecialAction] === raw[1].value,
            ) as RatBagSpecialAction | undefined;
            return {
                type: "special",
                action: id === undefined ? "unknown" : id,
            };
        } else if (raw[0] === 3) {
            const macro: RatBagMacroAction[] = [];
            for (const entry of raw[1].value as [number, number][]) {
                macro.push({
                    type: entry[0] === 0 ? "release" : "press",
                    keyCode: entry[1],
                });
            }
            return {
                type: "macro",
                macro: macro,
            };
        } else {
            return {
                type: "unknown",
            };
        }
    }

    /**
     * Binds this button to the given action.
     */
    public async setMapping(mapping: RatBagMapping): Promise<void> {
        let id = 1000;
        let variant: Variant = new Variant<number>("u", 0);
        if (mapping.type === "none") {
            id = 1000;
            variant = new Variant<number>("u", 0);
        } else if (mapping.type === "button") {
            id = 1;
            variant = new Variant<number>("u", mapping.button);
        } else if (mapping.type === "special") {
            id = 2;
            const func = RatBagButton.SPECIAL_ACTION_MAP[mapping.action];
            variant = new Variant<number>("u", func === undefined ? 0x40000000 : func);
        } else if (mapping.type === "macro") {
            id = 3;
            const actions: [number, number][] = [];
            for (const action of mapping.macro) {
                actions.push([action.type === "press" ? 1 : 0, action.keyCode]);
            }
            variant = new Variant<[number, number][]>("a(uu)", actions);
        }
        await this.setProperty("org.freedesktop.ratbag1.Button", "Mapping", new Variant("(uv)", [id, variant]));
    }
}

/**
 * A led on a device for a specific profile
 */
export class RatBagLed extends DBusObject {
    constructor(client: DBusClient, proxy: ProxyObject) {
        super(client, proxy);
    }

    /**
     * Gets the index for this led.
     */
    public async index(): Promise<number> {
        return (await this.getProperty("org.freedesktop.ratbag1.Led", "Index")).value;
    }

    /**
     * Gets the current mode of the led.
     */
    public async mode(): Promise<LedMode> {
        const modeId: number = (await this.getProperty("org.freedesktop.ratbag1.Led", "Mode")).value;
        switch (modeId) {
            case 1:
                return "on";
            case 2:
                return "cycle";
            case 3:
                return "breath";
            default:
                return "off";
        }
    }

    /**
     * Sets the mode of the led.
     */
    public async setMode(mode: LedMode): Promise<void> {
        let modeId = 0;
        if (mode === "on") {
            modeId = 1;
        } else if (mode === "cycle") {
            modeId = 2;
        } else if (mode === "breath") {
            modeId = 3;
        }
        await this.setProperty("org.freedesktop.ratbag1.Led", "Mode", new Variant<number>("u", modeId));
    }

    /**
     * Gets a list of supported led modes.
     */
    public async supportedModes(): Promise<LedMode[]> {
        const modeIds: number[] = (await this.getProperty("org.freedesktop.ratbag1.Led", "Mode")).value;
        const modes: LedMode[] = [];
        for (const modeId of modeIds) {
            switch (modeId) {
                case 0:
                    modes.push("off");
                    break;
                case 1:
                    modes.push("on");
                    break;
                case 2:
                    modes.push("cycle");
                    break;
                case 3:
                    modes.push("breath");
                    break;
            }
        }
        return modes;
    }

    /**
     * Gets the color, the led is currently in.
     */
    public async color(): Promise<RatBagColorObj & RatBagColorValue> {
        const color: [number, number, number] = (await this.getProperty("org.freedesktop.ratbag1.Led", "Color")).value;
        return {
            color: ((color[0] & 0xff) << 16) | ((color[1] & 0xff) << 8) | (color[2] & 0xff),
            red: color[0] & 0xff,
            green: color[1] & 0xff,
            blue: color[2] & 0xff,
        };
    }

    /**
     * Sets the color for the led.
     */
    public async setColor(color: RatBagColorObj | RatBagColorValue): Promise<void> {
        let value: [number, number, number];
        if ("color" in color) {
            value = [(color.color >> 16) & 0xff, (color.color >> 8) & 0xff, color.color & 0xff];
        } else {
            value = [color.red, color.green, color.blue];
        }
        await this.setProperty(
            "org.freedesktop.ratbag1.Led",
            "Color",
            new Variant<[number, number, number]>("(uuu)", value),
        );
    }

    /**
     * Gets the current effect duration in milliseconds. What exactly this means depends on the led mode.
     */
    public async effectDuration(): Promise<number> {
        return (await this.getProperty("org.freedesktop.ratbag1.Led", "EffectDuration")).value;
    }

    /**
     * Sets the current effect duration in milliseconds.
     */
    public async setEffectDuration(millis: number): Promise<void> {
        await this.setProperty("org.freedesktop.ratbag1.Led", "EffectDuration", new Variant<number>("u", millis));
    }

    /**
     * Gets the current led brightness [0;255]
     */
    public async brightness(): Promise<number> {
        return (await this.getProperty("org.freedesktop.ratbag1.Led", "Brightness")).value & 0xff;
    }

    /**
     * Sets the current led brightness [0;255]
     */
    public async setBrightness(brightness: number): Promise<void> {
        await this.setProperty(
            "org.freedesktop.ratbag1.Led",
            "Brightness",
            new Variant<number>("u", brightness & 0xff),
        );
    }
}

/**
 * A model of a ratbagd device.
 */
export type RatBagModel = RatBagModelUnknown | RatBagModelCommon;

/**
 * An unknown device model.
 */
export type RatBagModelUnknown = {
    busType: "unknown";
};

/**
 * A known device model.
 */
export type RatBagModelCommon = {
    /**
     * How the device id connected.
     */
    busType: "usb" | "bluetooth";

    /**
     * The vendor id of the device as a hex string.
     */
    vendorHex: string;

    /**
     * The vendor id of the device as a number.
     */
    vendorId: number;

    /**
     * The product id of the device as a hex string.
     */
    productHex: string;

    /**
     * The product id of the device as a number.
     */
    productId: number;

    /**
     * The version of the device. This number is only used internally to distinguish multiple
     * devices of the same type.
     */
    version: number;
};

/**
 * A resolution in DPI. This can either be a single value or separate values for x and y depending on the device.
 * When setting a DPI value, it must be exactly the kind of value, the device supports.
 */
export type RatBagDpi = number | { x: number; y: number };

/**
 * A mapping for a button.
 */
export type RatBagMapping =
    | RatBagMappingNone
    | RatBagMappingUnknown
    | RatBagMappingButton
    | RatBagMappingSpecial
    | RatBagMappingMacro;

/**
 * A button mapping that does nothing.
 */
export type RatBagMappingNone = {
    type: "none";
};

/**
 * An unknown button mapping.
 */
export type RatBagMappingUnknown = {
    type: "unknown";
};

/**
 * A button mapping that maps a physical button to a logical button.
 */
export type RatBagMappingButton = {
    type: "button";

    /**
     * The logical mouse button to map to.
     */
    button: number;
};

/**
 * A mapping that triggers a special action.
 */
export type RatBagMappingSpecial = {
    type: "special";

    /**
     * The action to trigger.
     */
    action: RatBagSpecialAction;
};

/**
 * A mapping that triggers a macro.
 */
export type RatBagMappingMacro = {
    type: "macro";
    macro: RatBagMacroAction[];
};

/**
 * An action in a macro.
 */
export type RatBagMacroAction = {
    type: "press" | "release";
    keyCode: number;
};

/**
 * A color represented by red, green and blue values in range [0;255]
 */
export type RatBagColorObj = {
    red: number;
    green: number;
    blue: number;
};

/**
 * A color represented as 0xRRGGBB
 */
export type RatBagColorValue = {
    color: number;
};

/**
 * A special button action.
 */
export type RatBagSpecialAction =
    | "unknown"
    | "doubleclick"
    | "wheel left"
    | "wheel right"
    | "wheel up"
    | "wheel down"
    | "ratched mode switch"
    | "resolution cycle up"
    | "resolution cycle down"
    | "resolution up"
    | "resolution down"
    | "resolution alternate"
    | "resolution default"
    | "profile cycle up"
    | "profile cycle down"
    | "profile up"
    | "profile down"
    | "second mode"
    | "battery level";

/**
 * A mode for a led.
 */
export type LedMode = "off" | "on" | "cycle" | "breath";

type RatBagDeviceInterface = ClientInterface & {
    Commit(): Promise<void>;
};

type RatBagProfileInterface = ClientInterface & {
    SetActive(): Promise<void>;
};

type RatBagResolutionInterface = ClientInterface & {
    SetDefault(): Promise<void>;
    SetActive(): Promise<void>;
};
