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

/**
 * The elgato light client is used to access all configured elgato lights. Just use the get methods.
 */
export class ElgatoLightClient {
    private lights: ElgatoLight[] = [];

    constructor(private config: ElgatoLightConfig) {
        this.lights = this.config.lights.map((light) => this.createLight(light.ipAddress, light.lightType, light.name));
    }

    private createLight(ipAddress: string, lightType: LightType, name?: string) {
        if (lightType === "KeyLight") {
            return new ElgatoKeyLight(ipAddress, name);
        } else {
            return new ElgatoLightStrip(ipAddress, name);
        }
    }

    /**
     * Tries to reach all elgato lights contained in the config provided in the constructor.
     * @returns an array of IP addresses of elgato lights that where configured but not reachable
     */
    async identifyNotReachableLights(): Promise<Array<string>> {
        const notReachableLights = [];

        for (const light of this.lights) {
            if (!(await light.validate())) {
                notReachableLights.push(light.ipAddress);
            }
        }

        return notReachableLights;
    }

    /**
     * Returns all configured elgato lights.
     * @returns an array of elgato lights (elgato key lights or light stripes)
     */
    getAllLights(): ElgatoLight[] {
        return [...this.lights];
    }

    /**
     * Returns the specified elgato light (elgato key light or light stripe)
     * @param name the name of the elgato light specified in the nodecg-io config
     * @returns the specified elgato light instance or undefined if the name was not found
     */
    getLightByName(name: string): ElgatoLight | undefined {
        return this.lights.find((light) => light.name === name);
    }

    /**
     * Returns the specified elgato light (elgato key light or light stripe)
     * @param ipAddress the ip address of the elgato light as specified in the nodecg-io config
     * @returns the specified elgato light instance or undefined if the address was not found
     */
    getLightByAddress(ipAddress: string): ElgatoLight | undefined {
        return this.lights.find((light) => light.ipAddress === ipAddress);
    }
}
