import { NodeCG } from "nodecg/types/server";
import { SlackServiceClient } from "nodecg-io-slack/extension";
import { requireService } from "nodecg-io-core/extension/serviceClientWrapper";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for Slack WebAPI started");

    const slack = requireService<SlackServiceClient>(nodecg, "slack");

    slack?.onAvailable(async (client) => {
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
    });

    slack?.onUnavailable(() => nodecg.log.info("Sample bundle for Slack WebAPI unset."));
};
