import * as midi from "easymidi";
const inputs = midi.getInputs();
const outputs = midi.getOutputs();

// This script is executed by itself and not by nodecg.
// Therefore we can't use the nodecg logger and fall back to console.log.
/* eslint-disable no-console */

console.log("Midi Inputs");
inputs.forEach((element: string) => {
    console.log("    " + element);
});
console.log("Midi Outputs");
outputs.forEach((element: string) => {
    console.log("    " + element);
});
