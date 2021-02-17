import fetch from "node-fetch";
import { NodeCG } from "nodecg/types/server";
import { Color } from "./interfaces";

/**
 * This class contains static helper methods, mostly used to verify the connection to your nanoleafs.
 */

export class NanoleafUtils {
    /**
     * This port seems to be default for all nanoleaf controllers
     */
    public static readonly defaultPort = 16021;

    /**
     * Checks whether the provided ip address returns anything other than 404.
     * @param ipAddress the ip address to test
     */
    static async verifyIpAddress(ipAddress: string): Promise<boolean> {
        const code = await this.checkConnection(ipAddress, "");
        return code !== 404;
    }

    /**
     * Checks whether the provided auth token is valid based on the provided ip address.
     * @param ipAddress the ip address of the nanoleaf controller
     * @param authToken an auth token, lol
     */
    static async verifyAuthKey(ipAddress: string, authToken: string): Promise<boolean> {
        const code = await this.checkConnection(ipAddress, authToken);
        return code === 200;
    }

    static buildBaseRequestAddress(ipAddress: string, authToken: string): string {
        return `http://${ipAddress}:${NanoleafUtils.defaultPort}/api/v1/${authToken}`;
    }

    /**
     * Tries to retrieve an auth key / token from the nanoleaf controller. Fails if the controller is not in pairing mode.
     * @param ipAddress the ip address of the nanoleaf controller
     * @param nodecg the current nodecg instance
     */
    static async retrieveAuthKey(ipAddress: string, nodecg: NodeCG): Promise<string> {
        const errorMessage =
            "Received error while requesting nanoleaf auth token. Make sure to press the 'on' button for 5 seconds before executing this command.";

        try {
            const response = await fetch(`http://${ipAddress}:${this.defaultPort}/api/v1/new`, { method: "POST" });

            const json = await response.json();
            return json.authToken || "";
        } catch (error) {
            nodecg.log.warn(errorMessage);
            return "";
        }
    }

    private static async checkConnection(ipAddress: string, authToken: string) {
        try {
            const response = await fetch(NanoleafUtils.buildBaseRequestAddress(ipAddress, authToken), {
                method: "GET",
            });

            return response.status;
        } catch {
            // Nothing to do here
        }
        return 404;
    }

    /**
     * Converts the specified color from the HSV (Hue-Saturation-Value) color space to the RGB (Red-Green-Blue) color space.
     * @param color a color in the HSV color space
     */
    static convertHSVtoRGB(color: { hue: number; saturation: number; value: number }): Color {
        // based on: https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
        const h = color.hue;
        const s = color.saturation;
        const v = color.value;
        let r, g, b;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0:
                (r = v), (g = t), (b = p);
                break;
            case 1:
                (r = q), (g = v), (b = p);
                break;
            case 2:
                (r = p), (g = v), (b = t);
                break;
            case 3:
                (r = p), (g = q), (b = v);
                break;
            case 4:
                (r = t), (g = p), (b = v);
                break;
            case 5:
                (r = v), (g = p), (b = q);
                break;
            default:
                (r = 0), (g = 0), (b = 0);
                break;
        }
        return {
            red: Math.round(r * 255),
            green: Math.round(g * 255),
            blue: Math.round(b * 255),
        };
    }
}
