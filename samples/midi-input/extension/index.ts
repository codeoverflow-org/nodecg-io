import { NodeCG } from "nodecg/types/server";
import { requireService } from "nodecg-io-core/extension/serviceClientWrapper";
import { MidiInputServiceClient } from "nodecg-io-midi-input/extension";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for midi-input started");

    const service = requireService<MidiInputServiceClient>(nodecg, "midi-input");
    service?.onAvailable((client) => {
        nodecg.log.info("Client has been updated.");

        const midiClient = client.getNativeClient();
        midiClient.on("cc", (msg: any) => {
            printMessage(msg, "cc");
        });
        midiClient.on("noteon", (msg: any) => {
            printMessage(msg, "noteon");
        });
        midiClient.on("noteoff", (msg: any) => {
            printMessage(msg, "noteoff");
        });
        midiClient.on("poly aftertouch", (msg: any) => {
            printMessage(msg, "poly aftertouch");
        });
        midiClient.on("channel aftertouch", (msg: any) => {
            printMessage(msg, "channel aftertouch");
        });
        midiClient.on("program", (msg) => {
            printMessage(msg, "program");
        });
        midiClient.on("pitch", (msg: any) => {
            printMessage(msg, "pitch");
        });
        midiClient.on("position", (msg: any) => {
            printMessage(msg, "position");
        });
        midiClient.on("mtc", (msg: any) => {
            printMessage(msg, "mtc");
        });
        midiClient.on("select", (msg: any) => {
            printMessage(msg, "mtc");
        });
    });

    service?.onUnavailable(() => nodecg.log.info("Client has been unset."));

    function printMessage(msg: any, event: string) {
        let str = "";
        for (const prop in msg) {
            str += prop + " " + msg[prop].toString() + " ";
        }
        nodecg.log.info(event + " " + str);
    }
};
