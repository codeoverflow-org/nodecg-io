import { NodeCG } from "nodecg/types/server";
import { requireService } from "nodecg-io-core";
import { MidiInputServiceClient } from "nodecg-io-midi-input";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for midi-input started");

    const service = requireService<MidiInputServiceClient>(nodecg, "midi-input");
    service?.onAvailable((client) => {
        nodecg.log.info("Midi input client has been updated.");

        const midiClient = client.getNativeClient();
        midiClient.on("cc", (msg) => {
            printMessage(msg, "cc");
        });
        midiClient.on("noteon", (msg) => {
            printMessage(msg, "noteon");
        });
        midiClient.on("noteoff", (msg) => {
            printMessage(msg, "noteoff");
        });
        midiClient.on("poly aftertouch", (msg) => {
            printMessage(msg, "poly aftertouch");
        });
        midiClient.on("channel aftertouch", (msg) => {
            printMessage(msg, "channel aftertouch");
        });
        midiClient.on("program", (msg) => {
            printMessage(msg, "program");
        });
        midiClient.on("pitch", (msg) => {
            printMessage(msg, "pitch");
        });
        midiClient.on("position", (msg) => {
            printMessage(msg, "position");
        });
        midiClient.on("mtc", (msg) => {
            printMessage(msg, "mtc");
        });
        midiClient.on("select", (msg) => {
            printMessage(msg, "select");
        });
    });

    service?.onUnavailable(() => nodecg.log.info("Midi input client has been unset."));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function printMessage(msg: any, event: string) {
        let str = "";
        for (const prop in msg) {
            str += prop + " " + msg[prop].toString() + " ";
        }
        nodecg.log.info(event + " " + str);
    }
};
