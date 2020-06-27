import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { StreamdeckServiceClient } from "nodecg-io-streamdeck/extension";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for twitch started");

    // This explicit cast determines the client type in the requireService call
    const streamdeck = (nodecg.extensions["nodecg-io-streamdeck"] as unknown) as
        | ServiceProvider<StreamdeckServiceClient>
        | undefined;

    streamdeck?.requireService(
        "streamdeck-rainbow",
        (client) => {
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
        },
        () => nodecg.log.info("Streamdeck client has been unset."),
    );
};
