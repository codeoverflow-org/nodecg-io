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

// Dates
for (const element of ["#date_date", "#date_datetime"]) {
    document.querySelector(element).addEventListener("change", (e) => {
        const date = e.target.value;
        nodecg.sendMessage(`onDate`, date);
    });
}

// Booleans
document.querySelector("#bool_false").onclick = () => {
    nodecg.sendMessage("onBool", false);
};
document.querySelector("#bool_true").onclick = () => {
    nodecg.sendMessage("onBool", true);
};

// Text
for (const element of ["oneline", "multiline"]) {
    document.querySelector(`#text_${element}_send`).onclick = () => {
        const value = document.querySelector(`#text_${element}`).value;
        nodecg.sendMessage("onText", value);
    };
}

// Lists
document.querySelector("#list_list_send").onclick = () => {
    const value = document.querySelector("#list_list").value;
    nodecg.sendMessage("onList", value);
};

// JSON
document.querySelector("#json_send").onclick = () => {
    const json = window.debugMonacoEditor.getValue();
    nodecg.sendMessage("onJSON", json);
};