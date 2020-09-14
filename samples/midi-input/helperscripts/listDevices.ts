import * as midi from "easymidi";
const inputs = midi.getInputs();
const outputs = midi.getOutputs();

console.log("Midi Inputs");
inputs.forEach((element: string) => {
    console.log("    " + element);
});
console.log("Midi Outputs");
outputs.forEach((element: string) => {
    console.log("    " + element);
});
