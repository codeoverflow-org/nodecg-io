import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { SlackServiceClient } from "nodecg-io-slack/extension";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for Slack WebAPI started");

    const slack = (nodecg.extensions["nodecg-io-slack"] as unknown) as ServiceProvider<SlackServiceClient> | undefined;

    slack?.requireService(
        "slack",
        async (client) => {
            // Get all channels
            const channelListResponse = await client.getRawClient().conversations.list();

            nodecg.log.info(JSON.stringify(channelListResponse.channels));

            // Example for sending a message
            const channel = "CHANNEL_ID";

            client
                .getRawClient()
                .chat.postMessage({ channel, text: "Hello world from nodecg.io" })
                .then((messageResponse) => {
                    nodecg.log.info(messageResponse);
                })
                .catch((err) => {
                    nodecg.log.error(err);
                });
        },
        () => nodecg.log.info("Sample bundle for Slack WebAPI unset."),
    );
};
