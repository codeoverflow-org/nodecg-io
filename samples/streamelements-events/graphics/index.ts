import { NodeCGAPIClient } from "@nodecg/types/client/api/api.client";
import { createApp, defineComponent } from "vue";
import type { StreamElementsReplicant } from "nodecg-io-streamelements";

declare global {
    const nodecg: NodeCGAPIClient;
    const NodeCG: typeof NodeCGAPIClient;
}

const replicant = nodecg.Replicant<StreamElementsReplicant>("streamelements");

const mainComponent = defineComponent<unknown, unknown, { streamElementsReplicant: StreamElementsReplicant }>({
    data() {
        return {
            streamElementsReplicant: {},
        };
    },
    created() {
        replicant.on("change", (newVal) => {
            if (newVal !== undefined) {
                this.streamElementsReplicant = newVal;
            }
        });
    },
    computed: {
        subTier() {
            const sub = this.streamElementsReplicant.lastSubscriber;
            if (!sub || !sub.data.tier) return undefined;

            if (sub.data.tier === "prime") {
                return "Twitch Prime";
            }

            // We want to display the tier as 1, 2, 3
            // However StreamElements stores the sub tiers as 1000, 2000 and 3000.
            // So we divide the tier by 1000 to get the tier in our expected format.
            const tierLevel = Number.parseInt(sub.data.tier) / 1000;
            return `Tier ${tierLevel}`;
        },
    },
});

createApp(mainComponent).mount("#app");
