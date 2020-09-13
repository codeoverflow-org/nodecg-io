const midi = require("easymidi");
const inputs = new midi.getInputs();
const outputs = new midi.getOutputs();

console.log("Midi Inputs");
inputs.forEach((element: string) => {
    console.log("    " + element);
});
console.log("Midi Outputs");
outputs.forEach((element: string) => {
    console.log("    " + element);
});
