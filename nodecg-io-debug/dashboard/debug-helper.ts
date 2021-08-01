/// <reference types="nodecg/types/browser" />
/// <reference types="monaco-editor/monaco" />

// Buttons
for (let i = 1; i <= 5; i++) {
    setHandler(`#click_button${i}`, "onclick", () => {
        nodecg.sendMessage("onClick", i);
    });
}

// Numbers
for (let i = 0; i < 5; i++) {
    const num = 10 ** i;
    setHandler(`#number_button${num}`, "onclick", () => {
        nodecg.sendMessage("onNumber", num);
    });
}

setHandler("#number_input1_send", "onclick", () => {
    const num = document.querySelector<HTMLInputElement>("#number_input1")?.value;
    nodecg.sendMessage("onNumber", num);
});
setHandler("#number_input2", "onchange", () => {
    const num = document.querySelector<HTMLInputElement>("#number_input2")?.value;
    nodecg.sendMessage("onNumber", num);
});

// Ranges
for (const range of ["0to100", "0to1", "M1to1"]) {
    const selector = "#range_" + range;
    document.querySelector(selector)?.addEventListener("change", () => {
        const num = document.querySelector<HTMLInputElement>(selector)?.value;
        nodecg.sendMessage(`onRange${range}`, num);
    });
}

// Color
document.querySelector("#color_color")?.addEventListener("input", () => {
    const color = document.querySelector<HTMLInputElement>("#color_color")?.value;
    nodecg.sendMessage(`onColor`, color);
});

// Dates
for (const element of ["#date_date", "#date_datetime"]) {
    document.querySelector(element)?.addEventListener("change", () => {
        const date = document.querySelector<HTMLInputElement>(element)?.value;
        nodecg.sendMessage(`onDate`, date);
    });
}

// Booleans
setHandler("#bool_false", "onclick", () => {
    nodecg.sendMessage("onBool", false);
});
setHandler("#bool_true", "onclick", () => {
    nodecg.sendMessage("onBool", true);
});

// Text
for (const element of ["oneline", "multiline"]) {
    setHandler(`#text_${element}_send`, "onclick", () => {
        const value = document.querySelector<HTMLInputElement>(`#text_${element}`)?.value;
        nodecg.sendMessage("onText", value);
    });
}

// Lists
setHandler("#list_list_send", "onclick", () => {
    const value = document.querySelector<HTMLTextAreaElement>("#list_list")?.value;
    nodecg.sendMessage("onList", value);
});

// JSON
// defined in debug-helper.html
declare const debugMonacoEditor: monaco.editor.IStandaloneCodeEditor;
setHandler("#json_send", "onclick", () => {
    const jsonString = debugMonacoEditor.getValue();
    try {
        const json = JSON.parse(jsonString);
        nodecg.sendMessage("onJSON", json);
    } catch (e) {
        nodecg.log.error(`Cannot send invalid json: ${e}`);
    }
});

// Util functions
function setHandler(querySelector: string, type: "onclick" | "onchange", fn: () => void): void {
    const element = document.querySelector<HTMLElement>(querySelector);
    if (!element) {
        nodecg.log.error(`Cannot set handler for element with this query selector: ${querySelector}`);
        return;
    }

    element[type] = fn;
}
