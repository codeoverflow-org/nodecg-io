import { NodeCG } from "nodecg/types/server";
import { requireService } from "nodecg-io-core/extension/serviceClientWrapper";
import { MidiOutputServiceClient } from "nodecg-io-midi-output/extension";
import { Note, Channel } from "easymidi";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for midi-output started");

    const service = requireService<MidiOutputServiceClient>(nodecg, "midi-output");
    service?.onAvailable((client) => {
        nodecg.log.info("Midioutput client has been updated.");
        const midiClient = client.getNativeClient();

        setInterval(() => {
            let noteVal: number = Math.round(Math.random() * 126);
            let velocityVal: number = Math.round(Math.random() * 126);
            let channelVal: Channel = <Channel>Math.round(Math.random() * 1);

            const data: Note = {
                note: noteVal,
                velocity: velocityVal,
                channel: 0,
            };
            midiClient.send("noteon", data);
        }, 1000);
    });

    service?.onUnavailable(() => nodecg.log.info("Midi output client has been unset."));
};
