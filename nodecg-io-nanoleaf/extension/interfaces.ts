export interface Color {
    red: number;
    green: number;
    blue: number;
}
export interface ColoredPanel {
    panelId: number;
    color: Color;
}
export interface PanelEffect {
    panelId: number;
    frames: { color: Color; transitionTime: number }[];
}
