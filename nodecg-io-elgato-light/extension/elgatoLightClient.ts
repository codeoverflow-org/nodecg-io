import { ElgatoLight } from ".";
import { ElgatoKeyLight, ElgatoLightStrip, LightType } from "./elgatoLight";

export interface ElgatoLightConfig {
    lights: [
        {
            ipAddress: string;
            lightType: LightType;
            name?: string;
        },
    ];
}

export class ElgatoLightClient {
    private lights: ElgatoLight[] = [];

    constructor(private config: ElgatoLightConfig) {
        this.lights = this.config.lights.map((light) => this.createLight(light.ipAddress, light.lightType));
    }

    private createLight(ipAddress: string, lightType: LightType) {
        if (lightType === "KeyLight") {
            return new ElgatoKeyLight(ipAddress);
        } else {
            return new ElgatoLightStrip(ipAddress);
        }
    }

    async identifyNotReachableLights(): Promise<Array<string>> {
        const notReachableLights = [];

        for (const light of this.lights) {
            if (!(await light.validate())) {
                notReachableLights.push(light.ipAddress);
            }
        }

        return notReachableLights;
    }

    getAllLights(): ElgatoLight[] {
        return [...this.lights];
    }

    getLightByName(name: string): ElgatoLight | undefined {
        return this.lights.find((light) => light.name === name);
    }

    getLightByAddress(ipAddress: string): ElgatoLight | undefined {
        return this.lights.find((light) => light.ipAddress === ipAddress);
    }
}
