/// <reference types="nodecg-types/types/browser" />

// Listens for event from opentts sample and plays the audio by the provided url.

const audioElement = document.getElementById("opentts-audio") as HTMLAudioElement;

// Play audio when the graphic is newly opened
nodecg.sendMessage("ready");

nodecg.listenFor("setSrc", (newSrc) => {
    audioElement.src = newSrc;
    audioElement.currentTime = 0;
    audioElement.play();
});
