import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { TelegramServiceClient } from "nodecg-io-telegram/extension";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for telegram started");

    // This explicit cast determines the client type in the requireService call
    const telegram = (nodecg.extensions["nodecg-io-telegram"] as unknown) as
        | ServiceProvider<TelegramServiceClient>
        | undefined;

    telegram?.requireService(
        "telegram",
        (client) => {
            nodecg.log.info("Telegram client has been updated, adding handlers for messages.");
            const testCommand = {
                command: "test",
                description: "This is a simple test command.",
            };

            client.getRawClient().setMyCommands([testCommand]);

            client.getRawClient().onText(/\/test/, (message) => {
                const chatID = message.chat.id;

                client.getRawClient().sendMessage(chatID, `Your ChatID is ${chatID}.`);
                client
                    .getRawClient()
                    .sendVenue(chatID, 50.9438305556, 6.97453611111, "Koelnmesse", "Messeplatz 1 Mülheim, 50679 Köln");
            });
        },
        () => nodecg.log.info("Telegram client has been unset."),
    );
};
