import { ObjectMap } from "nodecg-io-core/extension/types";

export function updateOptionsMap(node: HTMLSelectElement, options: ObjectMap<string, unknown>): void {
    const keys = [];

    for(const key in options) {
        if(!options.hasOwnProperty(key)) {
            continue;
        }
        keys.push(key);
    }

    updateOptionsArr(node, keys);
}

export function updateOptionsArr(node: HTMLSelectElement, options: string[]): void {
    for (let i = node.options.length - 1; i >= 0; i--) {
        node.options.remove(i);
    }

    options.forEach((optStr) => {
        const opt = document.createElement("option");
        opt.value = optStr;
        opt.innerText = optStr;
        node.options.add(opt);
    });
}