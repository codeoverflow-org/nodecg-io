import { DBusConfig } from "./index";
import * as dbus from "dbus-next";
import { MessageBus, ProxyObject, ClientInterface, Variant } from "dbus-next";

export class DBusClient {
    public readonly session: MessageBus;
    public readonly system: MessageBus;

    constructor(config: DBusConfig) {
        this.session = dbus.sessionBus(config);
        this.system = dbus.systemBus();
    }

    public async proxy<T>(config: DBusProxyConfig<T>): Promise<T> {
        const proxy = await (config.system ? this.system : this.session).getProxyObject(config.iface, config.path);
        return config.create(this, proxy);
    }

    static createClient(config: DBusConfig): DBusClient {
        return new DBusClient(config);
    }
}

// Required, so we don't have circular imports.
export interface DBusProxyConfig<T> {
    iface: string;
    path: string;
    system: boolean;
    create(client: DBusClient, proxy: ProxyObject): T;
}

export class DBusObject {
    protected readonly client: DBusClient;
    protected readonly proxy: ProxyObject;
    private readonly properties: ClientInterface;

    protected constructor(client: DBusClient, proxy: ProxyObject) {
        this.client = client;
        this.proxy = proxy;
        this.properties = proxy.getInterface("org.freedesktop.DBus.Properties");
    }

    async getProperty(iface: string, name: string): Promise<Variant> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return await this.properties.Get(iface, name);
    }

    async setProperty(iface: string, name: string, value: Variant): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return await this.properties.Set(iface, name, value);
    }
}
