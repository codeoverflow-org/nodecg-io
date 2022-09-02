import { NodeCG } from "nodecg-types/types/server";
import { OpenTTSClient } from "nodecg-io-opentts";
import { requireService } from "nodecg-io-core";

/**
 * Plays a "hello world" tts message inside the graphic of this sample bundle.
 */
async function playTTSInGraphic(client: OpenTTSClient, nodecg: NodeCG) {
    const voices = await client.getVoices("en");

    // Get random voice
    const voiceName = Object.keys(voices)[Math.floor(Math.random() * Object.keys(voices).length)];
    if (voiceName === undefined) throw new Error("no voice available");

    const helloWorldUrl = client.generateWavUrl("Hello World", voiceName);
    await nodecg.sendMessage("setSrc", helloWorldUrl);
}

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for the OpenTTS service started.");

    const opentts = requireService<OpenTTSClient>(nodecg, "opentts");

    nodecg.listenFor("ready", () => {
        const client = opentts?.getClient();
        if (client !== undefined){
            playTTSInGraphic(client, nodecg)
                .catch(err => nodecg.log.error(`Error while trying to play tts message: ${err.messages}`));
        }
    });

    opentts?.onAvailable(async (client) => {
        nodecg.log.info("OpenTTS service available.");

        const voices = await client.getVoices();
        const languages = await client.getLanguages();

        nodecg.log.info(
            `OpenTTS server supports ${Object.entries(voices).length} voices in ${languages.length} languages.`,
        );

        await playTTSInGraphic(client, nodecg);
    });

    opentts?.onUnavailable(() => {
        nodecg.log.info("OpenTTS service unavailable.");
    });
};
