import NodeCG from "@nodecg/types";
import { requireService } from "nodecg-io-core";
import { GameTTSClient } from "nodecg-io-gametts";

/**
 * Plays a hello world tts message inside the graphic of this sample bundle.
 */
async function playTTSInGraphic(client: GameTTSClient, nodecg: NodeCG.ServerAPI) {
    const voices = client.getVoices();

    // Get random voice
    const voiceId = Object.values(voices)[Math.floor(Math.random() * Object.keys(voices).length)];
    if (voiceId === undefined) throw new Error("no voice available");

    const helloWorldUrl = client.generateWavUrl("Hallo aus Noud Zeh Geh: Ei Oh!", voiceId);
    nodecg.sendMessage("setSrc", helloWorldUrl);
}

module.exports = function (nodecg: NodeCG.ServerAPI) {
    nodecg.log.info("Sample bundle for the GameTTS service started.");

    const gametts = requireService<GameTTSClient>(nodecg, "gametts");

    nodecg.listenFor("ready", () => {
        const client = gametts?.getClient();
        if (client !== undefined) {
            playTTSInGraphic(client, nodecg).catch((err) =>
                nodecg.log.error(`Error while trying to play tts message: ${err.messages}`),
            );
        }
    });

    gametts?.onAvailable(async (client) => {
        nodecg.log.info("GameTTS service available.");
        await playTTSInGraphic(client, nodecg);
    });

    gametts?.onUnavailable(() => {
        nodecg.log.info("GameTTS service unavailable.");
    });
};
