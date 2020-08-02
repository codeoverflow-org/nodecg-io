import { NodeCG } from "nodecg/types/server";
import { StreamdeckServiceClient } from "nodecg-io-streamdeck/extension";
import { requireService } from "nodecg-io-core/extension/serviceClientWrapper";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for streamdeck started");

    const streamdeck = requireService<StreamdeckServiceClient>(nodecg, "streamdeck");

    streamdeck?.onAvailable((client) => {
        nodecg.log.info("Streamdeck client has been updated, painting the streamdeck.");

        try {
            const deck = client.getRawClient();
            const colors: Array<[number, number, number]> = [
                [231, 60, 60],
                [231, 128, 60],
                [231, 197, 60],
                [197, 231, 60],
                [128, 231, 60],
                [60, 231, 60],
                [60, 231, 128],
                [60, 231, 179],
                [60, 197, 231],
                [60, 128, 231],
                [60, 60, 231],
                [128, 60, 231],
                [197, 60, 179],
                [231, 60, 128],
            ];
            let i = 0;

            setInterval(() => {
                try {
                    deck.fillColor(
                        i % deck.NUM_KEYS,
                        colors[i % colors.length][0],
                        colors[i % colors.length][1],
                        colors[i % colors.length][2],
                    );
                    i += 1;
                } catch (err) {
                    nodecg.log.info("Streamdeck error: " + String(err));
                    nodecg.log.info("You might need to replug your streamdeck. This is due to issue #21");
                }
            }, 200);
        } catch (err) {
            nodecg.log.info("Streamdeck error: " + String(err));
            nodecg.log.info("You might need to replug your streamdeck. This is due to issue #21");
        }
    });

    streamdeck?.onUnavailable(() => nodecg.log.info("Streamdeck client has been unset."));
};
