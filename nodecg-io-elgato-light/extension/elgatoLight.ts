import fetch from "node-fetch";
import { LightData } from "./lightData";
import { Response } from "node-fetch";

export type LightType = "KeyLight" | "LightStrip";

export class ElgatoLight {
    constructor(public readonly ipAddress: string, public readonly name?: string) {}

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

    protected async callPUT(body: LightData): Promise<Response> {
        return fetch(this.buildPath(), {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

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

    async isLightOn(): Promise<boolean> {
        return (await this.getLightData())?.on === 1;
    }

    async turnLightOn(): Promise<void> {
        const lightData = ElgatoLight.createLightData(1);
        await this.callPUT(lightData);
    }

    async turnLightOff(): Promise<void> {
        const lightData = ElgatoLight.createLightData(0);
        await this.callPUT(lightData);
    }

    async toggleLight(): Promise<void> {
        const state = await this.isLightOn();
        const lightData = ElgatoLight.createLightData(state ? 0 : 1);
        await this.callPUT(lightData);
    }

    async setBrightness(brightness: number): Promise<void> {
        const sanitizedValue = Math.max(0, Math.min(100, brightness));
        const lightData = ElgatoLight.createLightData(undefined, undefined, undefined, sanitizedValue);
        await this.callPUT(lightData);
    }

    async getBrightness(): Promise<number> {
        return (await this.getLightData())?.brightness || -1;
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

export class ElgatoKeyLight extends ElgatoLight {
    async setTemperature(temperature: number): Promise<void> {
        const sanitizedValue = Math.max(143, Math.min(344, 487 - temperature));
        const lightData = ElgatoLight.createLightData(undefined, undefined, undefined, undefined, sanitizedValue);
        await this.callPUT(lightData);
    }

    async getTemperature(): Promise<number> {
        const temperature = (await this.getLightData())?.temperature;

        if (temperature) {
            return 487 - temperature;
        } else {
            return -1;
        }
    }
}

export class ElgatoLightStrip extends ElgatoLight {
    async setHue(hue: number): Promise<void> {
        const sanitizedValue = Math.max(0, Math.min(360, hue));
        const lightData = ElgatoLight.createLightData(undefined, sanitizedValue);
        await this.callPUT(lightData);
    }

    async getHue(): Promise<number> {
        return (await this.getLightData())?.hue || -1;
    }

    async setSaturation(saturation: number): Promise<void> {
        const sanitizedValue = Math.max(0, Math.min(100, saturation));
        const lightData = ElgatoLight.createLightData(undefined, undefined, sanitizedValue);
        await this.callPUT(lightData);
    }

    async getSaturation(): Promise<number> {
        return (await this.getLightData())?.saturation || -1;
    }
}
