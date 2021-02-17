import { ServiceClient } from "nodecg-io-core";
import fetch from "node-fetch";
import { Response } from "node-fetch";
import { Color, ColoredPanel, PanelEffect } from "./interfaces";
import { NanoleafQueue } from "./nanoleafQueue";
import { NanoleafUtils } from "./nanoleafUtils";

export class NanoleafClient implements ServiceClient<NanoleafClient> {
    // Important: Does only remember colors which were directly set by using setPanelColor(s)
    private colors: Map<number, Color> = new Map<number, Color>();

    // This queue is used to queue effects
    private queue: NanoleafQueue = new NanoleafQueue();

    /**
     * Returns the client-specific effect queue.
     */
    getQueue(): NanoleafQueue {
        return this.queue;
    }

    getNativeClient(): NanoleafClient {
        return this; // yolo
    }

    constructor(private ipAddress: string, private authToken: string) {}

    private async callGET(relativePath: string) {
        return fetch(NanoleafUtils.buildBaseRequestAddress(this.ipAddress, this.authToken) + relativePath, {
            method: "GET",
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async callPUT(relativePath: string, body: any) {
        return fetch(NanoleafUtils.buildBaseRequestAddress(this.ipAddress, this.authToken) + relativePath, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    /**
     * Returns information about all panels, e.g. available effects, position data, ...
     */
    async getAllPanelInfo(): Promise<Response> {
        return this.callGET("");
    }

    /**
     * Returns the IDs of all panels which are connected to the nanoleaf controller
     * @param sortedByY the IDs are sorted by y level if true, otherwise sorted by x level
     */
    async getAllPanelIDs(sortedByY: boolean): Promise<Array<number>> {
        const response = await this.getAllPanelInfo();

        if (response.status !== 200) {
            return [];
        }

        const json = await response.json();
        const positionData: Array<{ x: number; y: number; panelId: number }> = json.panelLayout?.layout?.positionData;
        const panels = sortedByY ? positionData.sort((a, b) => a.y - b.y) : positionData.sort((a, b) => a.x - b.x);
        const panelIDs = panels?.map((entry: { panelId: number }) => entry.panelId);
        const panelIDsWithoutController = panelIDs.filter((entry: number) => entry !== 0);

        return panelIDsWithoutController;
    }

    /**
     * Sets the color of the specified panel directly using a raw effect write call. Not compatible with global effects.
     * @param panelId the panel ID. Use getAllPanelIDs() to retrieve all possible IDs.
     * @param color the color to send
     */
    async setPanelColor(panelId: number, color: Color): Promise<void> {
        await this.setPanelColors([{ panelId: panelId, color: color }]);
    }

    /**
     * Sets the colors of all specified panels directly using a raw effect write call.
     * @param data An array of ColoredPanel objects which hold information about panel IDs and colors.
     */
    async setPanelColors(data: ColoredPanel[]): Promise<void> {
        data.forEach((panel) => this.colors.set(panel.panelId, panel.color));

        if (data.length >= 1) {
            // This creates an simple short transition effect to the specified colors
            const panelData: PanelEffect[] = data.map((entry) => ({
                panelId: entry.panelId,
                frames: [{ color: entry.color, transitionTime: 1 }],
            }));

            await this.writeRawEffect("display", "static", false, panelData);
        }
    }

    /**
     * This bad boy function does more than every nanoleaf documentaion ever delivered. This is the pure decoding of awesomeness.
     * The raw effect write call is used to generate custom effects at runtime. Everything you ever dreamed of is possible.
     * @param command 'add' overlays the effect, 'display' overwrites the effect, 'displayTemp' overrides for a specified duration
     * @param animType 'static' for single colors, 'custom' for advanced animations
     * @param loop 'true' if the effect shall be looped after every frame was played
     * @param panelData an array of PanelEffect objects consisting of a panel id and an array of frames
     * @param duration optional, only used if command is set to 'displayTemp'
     */
    async writeRawEffect(
        command: "add" | "display" | "displayTemp",
        animType: "static" | "custom",
        loop: boolean,
        panelData: PanelEffect[],
        duration = 0,
    ): Promise<void> {
        if (panelData.every((panel) => panel.frames.length >= 1)) {
            // Create animData by mapping the PanelEffect objects to a data stream which is compliant to the nanoleaf documentation §3.2.6.1.
            const animData =
                `${panelData.length}` + panelData.map((entry) => this.mapPanelEffectToAnimData(entry)).join("");

            const json = {
                write: {
                    command: command,
                    duration: duration,
                    animType: animType,
                    animData: animData,
                    loop: loop,
                    palette: [],
                },
            };

            await this.callPUT("/effects", json);
        }
    }

    private mapPanelEffectToAnimData(panelEffect: PanelEffect): string {
        return ` ${panelEffect.panelId} ${panelEffect.frames.length}${panelEffect.frames
            .map((frame) => this.mapFrameToAnimData(frame.color, frame.transitionTime))
            .join("")}`;
    }

    private mapFrameToAnimData(color: Color, transitionTime: number): string {
        return ` ${color.red} ${color.green} ${color.blue} 0 ${transitionTime}`;
    }

    /**
     * Returns the cached color of the specified panel. Please note, this returns only colors which have been set by using setPanelColor(s).
     * @param panelId a valid panel id
     */
    getPanelColor(panelId: number): Color {
        return this.colors.get(panelId) || { red: 0, blue: 0, green: 0 };
    }

    /**
     * Returns the cached color of all panels. Please note, this returns only colors which have been set by using setPanelColor(s).
     */
    getAllPanelColors(): Map<number, Color> {
        return this.colors;
    }

    /**
     * Sets the brightness of all panels.
     * @param level a number between 0 - 100
     */
    async setBrightness(level: number): Promise<void> {
        const data = { brightness: { value: level } };
        await this.callPUT("/state", data);
    }

    /**
     * Sets the state of all panels.
     * @param on true, if the nanoleaf shall shine. false, if you're sad and boring
     */
    async setState(on: boolean): Promise<void> {
        const data = { on: { value: on } };
        await this.callPUT("/state", data);
    }

    /**
     * Sets the hue of all panels.
     * @param hue a number between 0 - 360
     */
    async setHue(hue: number): Promise<void> {
        const data = { hue: { value: hue } };
        await this.callPUT("/state", data);
    }

    /**
     * Sets the saturation of all panels.
     * @param sat a number between 0 - 100
     */
    async setSaturation(sat: number): Promise<void> {
        const data = { sat: { value: sat } };
        await this.callPUT("/state", data);
    }

    /**
     * Sets the color temperature of all panels.
     * @param temperature a number between 1200 - 6500
     */
    async setColorTemperature(temperature: number): Promise<void> {
        const data = { ct: { value: temperature } };
        await this.callPUT("/state", data);
    }
}
