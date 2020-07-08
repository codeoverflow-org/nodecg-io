import { EventEmitter } from "events";

export = easymidi;

declare namespace easymidi {
    type Channel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

    interface Note {
        note: number;
        velocity: number;
        channel: Channel;
    }

    interface PolyAfterTouch {
        note: number;
        pressure: number;
        channel: Channel;
    }

    interface ControlChange {
        controller: number;
        value: number;
        channel: Channel;
    }

    interface Program {
        number: number;
        channel: Channel;
    }

    interface ChannelAfterTouch {
        pressure: number;
        channel: Channel;
    }

    interface Pitch {
        value: number;
        channel: Channel;
    }

    interface Position {
        value: number;
    }

    interface Mtc {
        type: number;
        value: number;
    }

    interface Select {
        song: number;
    }

    interface SystemException {
        bytes: number[];
    }

    class Input extends EventEmitter {
        constructor(device: string, virtual?: boolean);

        on(evt: "noteon", handler: (param: Note) => void): this;
        on(evt: "noteoff", handler: (param: Note) => void): this;
        on(evt: "poly aftertouch", handler: (param: PolyAfterTouch) => void): this;
        on(evt: "cc", handler: (param: ControlChange) => void): this;
        on(evt: "program", handler: (param: Program) => void): this;
        on(evt: "channel aftertouch", handler: (param: ChannelAfterTouch) => void): this;
        on(evt: "pitch", handler: (param: Pitch) => void): this;
        on(evt: "position", handler: (param: Position) => void): this;
        on(evt: "mtc", handler: (param: Mtc) => void): this;
        on(evt: "select", handler: (param: Select) => void): this;
        on(evt: "clock", handler: () => void): this;
        on(evt: "start", handler: () => void): this;
        on(evt: "continue", handler: () => void): this;
        on(evt: "stop", handler: () => void): this;
        on(evt: "activesense", handler: () => void): this;
        on(evt: "reset", handler: () => void): this;
        on(evt: "sysex", handler: () => void): this;

        close(): void;
    }

    class Output {
        constructor(device: string, virtual?: boolean);

        send(evt: "noteon", param: Note): void;
        send(evt: "noteoff", param: Note): void;
        send(evt: "poly aftertouch", param: PolyAfterTouch): void;
        send(evt: "cc", param: ControlChange): void;
        send(evt: "program", param: Program): void;
        send(evt: "channel aftertouch", param: ChannelAfterTouch): void;
        send(evt: "pitch", param: Pitch): void;
        send(evt: "position", param: Position): void;
        send(evt: "mtc", param: Mtc): void;
        send(evt: "select", param: Select): void;
        send(evt: "clock"): void;
        send(evt: "start"): void;
        send(evt: "continue"): void;
        send(evt: "stop"): void;
        send(evt: "activesense"): void;
        send(evt: "reset"): void;
        send(evt: "reset", param: number[]): void;

        close(): void;
    }

    function getInputs(): Array<string>;
    function getOnputs(): Array<string>;
}
