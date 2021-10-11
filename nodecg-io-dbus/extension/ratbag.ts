import { DBusClient, DBusProxyConfig, DBusObject } from "./dbusClient";
import { ProxyObject, ClientInterface, Variant } from "dbus-next";

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

    public async api(): Promise<number> {
        return (await this.getProperty("org.freedesktop.ratbag1.Manager", "APIVersion")).value;
    }

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

export class RatBagDevice extends DBusObject {
    private readonly device: RatBagDeviceInterface;

    constructor(client: DBusClient, proxy: ProxyObject) {
        super(client, proxy);
        this.device = proxy.getInterface("org.freedesktop.ratbag1.Device") as RatBagDeviceInterface;
    }

    public async name(): Promise<string> {
        return (await this.getProperty("org.freedesktop.ratbag1.Device", "Name")).value;
    }

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

    public async commit(): Promise<void> {
        await this.device.Commit();
    }

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

export class RatBagProfile extends DBusObject {
    private readonly profile: RatBagProfileInterface;

    constructor(client: DBusClient, proxy: ProxyObject) {
        super(client, proxy);
        this.profile = proxy.getInterface("org.freedesktop.ratbag1.Profile") as RatBagProfileInterface;
    }

    public async index(): Promise<number> {
        return (await this.getProperty("org.freedesktop.ratbag1.Profile", "Index")).value;
    }

    public async name(): Promise<string | undefined> {
        const name = (await this.getProperty("org.freedesktop.ratbag1.Profile", "Name")).value;
        return name === "" ? undefined : name;
    }

    public async setName(name: string): Promise<void> {
        await this.setProperty("org.freedesktop.ratbag1.Profile", "Name", new Variant<string>("s", name));
    }

    public async enabled(): Promise<boolean> {
        return (await this.getProperty("org.freedesktop.ratbag1.Profile", "Enabled")).value;
    }

    public async enable(): Promise<void> {
        await this.setProperty("org.freedesktop.ratbag1.Profile", "Enabled", new Variant<boolean>("b", true));
    }

    public async disable(): Promise<void> {
        await this.setProperty("org.freedesktop.ratbag1.Profile", "Enabled", new Variant<boolean>("b", false));
    }

    public async active(): Promise<boolean> {
        return (await this.getProperty("org.freedesktop.ratbag1.Profile", "IsActive")).value;
    }

    public async activate(): Promise<void> {
        return await this.profile.SetActive();
    }

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

export class RatBagResolution extends DBusObject {
    private readonly resolution: RatBagResolutionInterface;

    constructor(client: DBusClient, proxy: ProxyObject) {
        super(client, proxy);
        this.resolution = proxy.getInterface("org.freedesktop.ratbag1.Resolution") as RatBagResolutionInterface;
    }

    public async index(): Promise<number> {
        return (await this.getProperty("org.freedesktop.ratbag1.Resolution", "Index")).value;
    }

    public async active(): Promise<boolean> {
        return (await this.getProperty("org.freedesktop.ratbag1.Resolution", "IsActive")).value;
    }

    public async default(): Promise<boolean> {
        return (await this.getProperty("org.freedesktop.ratbag1.Resolution", "IsDefault")).value;
    }

    public async activate(): Promise<void> {
        await this.resolution.SetActive();
    }

    public async setDefault(): Promise<void> {
        await this.resolution.SetDefault();
    }

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

    public async setDpi(dpi: RatBagDpi): Promise<void> {
        const variant =
            typeof dpi === "number"
                ? new Variant<number>("u", dpi)
                : new Variant<[number, number]>("(uu)", [dpi.x, dpi.y]);
        await this.setProperty("org.freedesktop.ratbag1.Resolution", "Resolution", variant);
    }

    public async allowedDpiValues(): Promise<number[]> {
        return (await this.getProperty("org.freedesktop.ratbag1.Resolution", "Resolutions")).value;
    }
}

export class RatBagButton extends DBusObject {
    private static readonly SPECIAL_ACTION_MAP: Record<RatBagSpecialAction, number> = {
        unknown: 0x40000000,
        doubleclick: 0x40000001,
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

    public async index(): Promise<number> {
        return (await this.getProperty("org.freedesktop.ratbag1.Button", "Index")).value;
    }

    public async mapping(): Promise<RatBagMapping> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw: [number, any] = (await this.getProperty("org.freedesktop.ratbag1.Button", "Mapping")).value;
        if (raw[0] === 0) {
            return {
                type: "none",
            };
        } else if (raw[0] === 1) {
            return {
                type: "button",
                button: raw[1],
            };
        } else if (raw[0] === 2) {
            const id = Object.keys(RatBagButton.SPECIAL_ACTION_MAP).find(
                (key) => RatBagButton.SPECIAL_ACTION_MAP[key as RatBagSpecialAction] === raw[1],
            ) as RatBagSpecialAction | undefined;
            return {
                type: "special",
                action: id === undefined ? "unknown" : id,
            };
        } else if (raw[0] === 3) {
            const macro: RatBagMacroAction[] = [];
            for (const entry of raw[1] as [number, number][]) {
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

    public async setMapping(mapping: RatBagMapping): Promise<void> {
        let variant: Variant = new Variant<[number, number]>("(uu)", [1000, 0]);
        if (mapping.type === "none") {
            variant = new Variant<[number, number]>("(uu)", [0, 0]);
        } else if (mapping.type === "button") {
            variant = new Variant<[number, number]>("(uu)", [1, mapping.button]);
        } else if (mapping.type === "special") {
            const func = RatBagButton.SPECIAL_ACTION_MAP[mapping.action];
            variant = new Variant<[number, number]>("(uu)", [2, func === undefined ? 0x40000000 : func]);
        } else if (mapping.type === "macro") {
            const actions: [number, number][] = [];
            for (const action of mapping.macro) {
                actions.push([action.type === "press" ? 1 : 0, action.keyCode]);
            }
            variant = new Variant<[number, [number, number][]]>("(ua(uu))", [3, actions]);
        }
        await this.setProperty("org.freedesktop.ratbag1.Button", "Mapping", variant);
    }
}

export class RatBagLed extends DBusObject {
    constructor(client: DBusClient, proxy: ProxyObject) {
        super(client, proxy);
    }
}

export type RatBagModelUnknown = {
    busType: "unknown";
};

export type RatBagModelCommon = {
    busType: "usb" | "bluetooth";
    vendorHex: string;
    vendorId: number;
    productHex: string;
    productId: number;
    version: number;
};

export type RatBagModel = RatBagModelUnknown | RatBagModelCommon;

export type RatBagDpi = number | { x: number; y: number };

export type RatBagMapping =
    | RatBagMappingNone
    | RatBagMappingUnknown
    | RatBagMappingButton
    | RatBagMappingSpecial
    | RatBagMappingMacro;

export type RatBagMappingNone = {
    type: "none";
};

export type RatBagMappingUnknown = {
    type: "unknown";
};

export type RatBagMappingButton = {
    type: "button";
    button: number;
};

export type RatBagMappingSpecial = {
    type: "special";
    action: RatBagSpecialAction;
};

export type RatBagMappingMacro = {
    type: "macro";
    macro: RatBagMacroAction[];
};

export type RatBagMacroAction = {
    type: "press" | "release";
    keyCode: number;
};

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
