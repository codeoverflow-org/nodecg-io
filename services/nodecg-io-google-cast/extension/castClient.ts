import { GoogleCastConfig } from "./index";
import Device from "chromecast-api/lib/device";
import { EventEmitter } from "events";

const CONNECT_TIMEOUT = 15000;

export class GoogleCastClient extends Device {
    static async createClient(config: GoogleCastConfig): Promise<GoogleCastClient> {
        const device = new GoogleCastClient({
            name: config.name ?? "",
            friendlyName: config.friendlyName ?? "",
            host: config.host,
        });

        const d = device as GoogleCastClient & {
            client: EventEmitter;
        };

        await new Promise((resolve, reject) => {
            d._tryConnect(() => resolve(undefined));

            d.client.on("error", (err) => {
                // oh nein
                reject(err);
            });

            setTimeout(() => reject(new Error("Connect timeout reached")), CONNECT_TIMEOUT);
        });

        return device;
    }
}
