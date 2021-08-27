/**
 * DTO for elgato light http communication.
 */
export interface LightData {
    numberOfLights: 1;
    lights: [
        {
            on?: number;
            hue?: number;
            saturation?: number;
            brightness?: number;
            temperature?: number;
        },
    ];
}
