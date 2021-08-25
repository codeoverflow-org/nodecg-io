import { NodeCG } from "nodecg-types/types/server";
import { requireService } from "nodecg-io-core";
import { MidiInputServiceClient } from "nodecg-io-midi-input";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for midi-input started");

    const service = requireService<MidiInputServiceClient>(nodecg, "midi-input");
    service?.onAvailable((client) => {
        nodecg.log.info("Midi-input client has been updated, listening to events.");

        client.on("cc", (msg) => {
            printMessage(msg, "cc");
        });
        client.on("noteon", (msg) => {
            printMessage(msg, "noteon");
        });
        client.on("noteoff", (msg) => {
            printMessage(msg, "noteoff");
        });
        client.on("poly aftertouch", (msg) => {
            printMessage(msg, "poly aftertouch");
        });
        client.on("channel aftertouch", (msg) => {
            printMessage(msg, "channel aftertouch");
        });
        client.on("program", (msg) => {
            printMessage(msg, "program");
        });
        client.on("pitch", (msg) => {
            printMessage(msg, "pitch");
        });
        client.on("position", (msg) => {
            printMessage(msg, "position");
        });
        client.on("mtc", (msg) => {
            printMessage(msg, "mtc");
        });
        client.on("select", (msg) => {
            printMessage(msg, "select");
        });
    });

    service?.onUnavailable(() => nodecg.log.info("Midi-input client has been unset."));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function printMessage(msg: any, event: string) {
        let str = "";
        for (const prop in msg) {
            str += prop + " " + msg[prop].toString() + " ";
        }
        nodecg.log.info(event + " " + str);
    }
};
