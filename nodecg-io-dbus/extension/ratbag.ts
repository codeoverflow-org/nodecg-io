import { DBusClient, DBusProxyConfig, DBusObject } from "./dbusClient";
import { ProxyObject } from "dbus-next";

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
    constructor(client: DBusClient, proxy: ProxyObject) {
        super(client, proxy);
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
