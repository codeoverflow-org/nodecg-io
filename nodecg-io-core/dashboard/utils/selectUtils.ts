import { ObjectMap } from "nodecg-io-core/extension/service";

export function updateOptionsMap(node: HTMLSelectElement, options: ObjectMap<unknown>): void {
    updateOptionsArr(node, Object.keys(options));
}

export function updateOptionsArr(node: HTMLSelectElement, options: string[]): void {
    const previouslySelected = node.options[node.selectedIndex]?.value;

    // Remove all children.
    node.innerHTML = "";

    options.sort().forEach((optStr, i) => {
        const opt = document.createElement("option");
        opt.value = optStr;
        opt.innerText = optStr;
        node.options.add(opt);

        // Try to reselect the previously selected item
        if (optStr === previouslySelected) {
            node.selectedIndex = i;
        }
    });
}
