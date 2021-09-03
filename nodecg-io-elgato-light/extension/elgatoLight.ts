import fetch from "node-fetch";
import { LightData } from "./lightData";

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

    private async callPUT(body: LightData) {
        return fetch(this.buildPath(), {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    async isLightOn(): Promise<boolean> {
        const response = await this.callGET();

        if (response.status !== 200) {
            return false;
        }

        const json = (await response.json()) as LightData;
        return json.lights[0]?.on === 1;
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

    // TODO: Implement brightness getter and setter

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
    // TODO: Implement temperature getter and setter
}

export class ElgatoLightStrip extends ElgatoLight {
    // TODO: Implement hue and saturation getter and setter
}
