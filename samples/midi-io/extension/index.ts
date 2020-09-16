import { NodeCG } from "nodecg/types/server";
import { requireService } from "nodecg-io-core/extension/serviceClientWrapper";
import { MidiInputServiceClient } from "nodecg-io-midi-input/extension";
import { MidiOutputServiceClient } from "nodecg-io-midi-output/extension";
import { Input, Output } from "easymidi";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for <the-service-name> started");

    const inputService = requireService<MidiInputServiceClient>(nodecg, "midi-input");
    const outputService = requireService<MidiOutputServiceClient>(nodecg, "midi-output");

    let midiInput: null | Input = null;
    let midiOutput: null | Output = null;

    inputService?.onAvailable((client) => {
        nodecg.log.info("Midi-input client has been updated.");
        midiInput = client.getNativeClient();
        if (midiOutput != null) {
            setListeners(midiInput, midiOutput);
        }
    });
    outputService?.onAvailable((client) => {
        nodecg.log.info("Midi-output client has been updated.");
        midiOutput = client.getNativeClient();
        if (midiInput != null) {
            setListeners(midiInput, midiOutput);
        }
    });

    inputService?.onUnavailable(() => nodecg.log.info("Midi-input client has been unset."));
    outputService?.onUnavailable(() => nodecg.log.info("Midi-output client has been unset."));
    // Copy from "samples/midi-input/extension/index.ts"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function printMessage(msg: any, event: string) {
        let str = "";
        for (const prop in msg) {
            str += prop + " " + msg[prop].toString() + " ";
        }
        nodecg.log.info(event + " " + str);
    }

    function setListeners(inp: Input, out: Output) {
        inp.on("cc", (msg) => {
            printMessage(msg, "cc");
            if (msg.value > 63) {
                msg.value = Math.round(Math.random() * 127);
            }
            out.send("cc", msg);
        });
        inp.on("noteon", (msg) => {
            printMessage(msg, "noteon");
            if (msg.velocity != 0) {
                msg.velocity = Math.round(Math.random() * 127);
            }
            out.send("noteon", msg);
        });
        inp.on("noteoff", (msg) => {
            printMessage(msg, "noteoff");
            out.send("noteoff", msg);
        });
    }
};
