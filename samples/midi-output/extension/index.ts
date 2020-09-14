import { NodeCG } from "nodecg/types/server";
import { requireService } from "nodecg-io-core/extension/serviceClientWrapper";
import { MidiOutputServiceClient } from "nodecg-io-midi-output/extension";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for midi-output started");

    const service = requireService<MidiOutputServiceClient>(nodecg, "midi-output");
    service?.onAvailable((client) => {
        nodecg.log.info("Midioutput client has been updated.");

        // TODO do something with the client to demonstrate the functionality.
    });

    service?.onUnavailable(() => nodecg.log.info("Midi output client has been unset."));
};
