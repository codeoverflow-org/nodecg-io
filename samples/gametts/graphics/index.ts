import { NodeCGAPIClient } from "@nodecg/types/client/api/api.client";

declare global {
    const nodecg: NodeCGAPIClient;
    const NodeCG: typeof NodeCGAPIClient;
}

// Listens for event from gametts sample and plays the audio by the provided url.

const audioElement = document.getElementById("gametts-audio") as HTMLAudioElement;

// Play audio when the graphic is newly opened
nodecg.sendMessage("ready");

nodecg.listenFor("setSrc", (newSrc) => {
    audioElement.src = newSrc;
    audioElement.currentTime = 0;
    audioElement.play();
});
