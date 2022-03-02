/// <reference types="nodecg-types/types/browser" />
import { createApp, defineComponent } from "vue/dist/vue.esm-bundler.js";
import type { StreamElementsReplicant } from "nodecg-io-streamelements";

const replicant = nodecg.Replicant<StreamElementsReplicant>("streamelements");

const mainComponent = defineComponent<{}, {}, { se: StreamElementsReplicant }>({
    data() {
        return {
            se: {},
        };
    },
    created() {
        replicant.on("change", (newVal) => {
            this.se = newVal;
        });
    },
    computed: {
        subTier() {
            const sub = this.se.lastSubscriber;
            if (!sub || !sub.data.tier) return undefined;

            if (sub.data.tier === "prime") {
                return "Twitch Prime";
            }

            return `Tier ${Number.parseInt(sub.data.tier) / 1000}`;
        },
    },
});

createApp(mainComponent).mount("#app");
