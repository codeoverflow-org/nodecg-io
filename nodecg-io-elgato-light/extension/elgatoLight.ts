import fetch from "node-fetch";
import { LightData } from "./lightData";
import { Response } from "node-fetch";

export type LightType = "KeyLight" | "LightStrip";

/**
 * Represents an elgato light. Is never directly created but has subclasses for the different light types.
 */
export abstract class ElgatoLight {
    constructor(public readonly ipAddress: string, public readonly name?: string) {}

    /**
     * Tests if the elgato light is reachable.
     * @returns true if the test call returned success. false, otherwise
     */
    public async validate(): Promise<boolean> {
        const response = await this.callGET();
        return response.status === 200;
    }

    private buildPath(): string {
        return `http://${this.ipAddress}:9123/elgato/lights`;
    }

    private async callGET() {
        return fetch(this.buildPath(), {
            method: "GET",
        });
    }

    /**
     * Helper method to call HTTP PUT on the elgato light.
     * @param body json data to send to the elgato light
     * @returns the response of the elgato light
     */
    protected async callPUT(body: LightData): Promise<Response> {
        return fetch(this.buildPath(), {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    /**
     * Helper method to call HTTP GET on the elgato light and ease the interpretation of the response.
     * @returns the response of the elgato light or undefined
     */
    protected async getLightData(): Promise<
        | {
              on?: number | undefined;
              hue?: number | undefined;
              saturation?: number | undefined;
              brightness?: number | undefined;
              temperature?: number | undefined;
          }
        | undefined
    > {
        const response = await this.callGET();

        if (response.status !== 200) {
            return undefined;
        }

        return ((await response.json()) as LightData).lights[0];
    }

    /**
     *
     * @returns Returns true if the light is switched on.
     */
    async isLightOn(): Promise<boolean> {
        return (await this.getLightData())?.on === 1;
    }

    /**
     * Switches the elgato light on.
     */
    async turnLightOn(): Promise<void> {
        const lightData = ElgatoLight.createLightData(1);
        await this.callPUT(lightData);
    }

    /**
     * Switches the elgato light off.
     */
    async turnLightOff(): Promise<void> {
        const lightData = ElgatoLight.createLightData(0);
        await this.callPUT(lightData);
    }

    /**
     * Toggles the on/off state of the elgato light.
     */
    async toggleLight(): Promise<void> {
        const state = await this.isLightOn();
        const lightData = ElgatoLight.createLightData(state ? 0 : 1);
        await this.callPUT(lightData);
    }

    /**
     * Sets the brightness of the elgato light.
     * @param brightness a value between 0.0 and 100.0
     */
    async setBrightness(brightness: number): Promise<void> {
        const sanitizedValue = Math.max(0, Math.min(100, brightness));
        const lightData = ElgatoLight.createLightData(undefined, undefined, undefined, sanitizedValue);
        await this.callPUT(lightData);
    }

    /**
     * Returns the brightness of the elgato light.
     * @returns a value between 0.0 and 100.0 or -1 if an error occurred
     */
    async getBrightness(): Promise<number> {
        return (await this.getLightData())?.brightness ?? -1;
    }

    protected static createLightData(
        on?: number,
        hue?: number,
        saturation?: number,
        brightness?: number,
        temperature?: number,
    ): LightData {
        return {
            numberOfLights: 1,
            lights: [
                {
                    on: on,
                    hue: hue,
                    saturation: saturation,
                    brightness: brightness,
                    temperature: temperature,
                },
            ],
        };
    }
}

/**
 * Represents an elgato key light, e.g., the key light or key light air.
 */
export class ElgatoKeyLight extends ElgatoLight {
    private static readonly temperatureFactor = 1000000;

    /**
     * Sets the temperature of the elgato key light.
     * @param temperature a value between 2900 and 7000 kelvin
     */
    async setTemperature(temperature: number): Promise<void> {
        const sanitizedValue = Math.max(143, Math.min(344, ElgatoKeyLight.temperatureFactor / temperature));
        const lightData = ElgatoLight.createLightData(undefined, undefined, undefined, undefined, sanitizedValue);
        await this.callPUT(lightData);
    }

    /**
     * Returns the temperature of the elgato key light.
     * @returns a value between 2900 and 7000 or -1 if an error occurred
     */
    async getTemperature(): Promise<number> {
        const temperature = (await this.getLightData())?.temperature;

        if (temperature !== undefined) {
            return ElgatoKeyLight.temperatureFactor / temperature;
        } else {
            return -1;
        }
    }
}

/**
 * Represents an elgato light stripe of any length.
 */
export class ElgatoLightStrip extends ElgatoLight {
    /**
     * Sets the hue of the elgato light stripe.
     * @param hue a value between 0.0 and 360.0
     */
    async setHue(hue: number): Promise<void> {
        const sanitizedValue = Math.max(0, Math.min(360, hue));
        const lightData = ElgatoLight.createLightData(undefined, sanitizedValue);
        await this.callPUT(lightData);
    }

    /**
     * Returns the hue of the elgato light stripe.
     * @returns a value between 0.0 and 360.0 or -1 if an error occurred
     */
    async getHue(): Promise<number> {
        return (await this.getLightData())?.hue ?? -1;
    }

    /**
     * Sets the saturation of the elgato light stripe.
     * @param saturation a value between 0.0 and 100.0
     */
    async setSaturation(saturation: number): Promise<void> {
        const sanitizedValue = Math.max(0, Math.min(100, saturation));
        const lightData = ElgatoLight.createLightData(undefined, undefined, sanitizedValue);
        await this.callPUT(lightData);
    }

    /**
     * Returns the saturation of the elgato light stripe.
     * @returns a value between 0.0 and 100.0 or -1 if an error occurred
     */
    async getSaturation(): Promise<number> {
        return (await this.getLightData())?.saturation ?? -1;
    }
}
