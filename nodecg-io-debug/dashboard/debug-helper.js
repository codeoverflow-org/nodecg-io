/* eslint-disable no-undef */

// Buttons
for (let i = 1; i <= 5; i++) {
    document.querySelector(`#click_button${i}`).onclick = () => {
        nodecg.sendMessage("onClick", i);
    };
}

// Numbers
for (let i = 0; i < 5; i++) {
    const num = 10 ** i;
    document.querySelector(`#number_button${num}`).onclick = () => {
        nodecg.sendMessage("onNumber", num);
    };
}
document.querySelector(`#number_input1_send`).onclick = () => {
    const num = document.querySelector('#number_input1').value;
    nodecg.sendMessage("onNumber", num);
};
document.querySelector(`#number_input2`).onchange = () => {
    const num = document.querySelector('#number_input2').value;
    nodecg.sendMessage("onNumber", num);
};

// Ranges
for (const range of ["0to100", "0to1", "M1to1"]) {
    document.querySelector("#range_" + range).addEventListener("change", (e) => {
        const num = e.target.value;
        nodecg.sendMessage(`onRange${range}`, num);
    });
}

// Color
document.querySelector("#color_color").addEventListener("input", (e) => {
    const color = e.target.value;
    nodecg.sendMessage(`onColor`, color);
});
