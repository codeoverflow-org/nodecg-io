import { NodeCG } from "nodecg/types/server";
import { SlackServiceClient } from "nodecg-io-slack";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for Slack WebAPI started");

    const slack = requireService<SlackServiceClient>(nodecg, "slack");

    slack?.onAvailable(async (client) => {
        nodecg.log.info("Slack WebAPI client has been updated, sending message to channel.");
        // Get all channels
        const channelListResponse = await client.getNativeClient().conversations.list();

        nodecg.log.info(JSON.stringify(channelListResponse.channels));

        // Example for sending a message
        const channel = "CHANNEL_ID";

        client
            .getNativeClient()
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
