import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { DiscordServiceClient } from "nodecg-io-discord/extension";
import { TianeServiceClient } from "nodecg-io-tiane/extension";
import { TextChannel, User } from "discord.js";

/*
Adds a discord bot that is powered by TIANE. Ping it if you wan't to talk to her.
*/

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for discord started");

    let myDiscord: DiscordServiceClient | null = null;
    let myChannel: TextChannel | null = null;
    let myTiane: TianeServiceClient | null = null;
    const userMap: Record<string, string> = {};

    const discord = (nodecg.extensions["nodecg-io-discord"] as unknown) as
        | ServiceProvider<DiscordServiceClient>
        | undefined;

    const dChannel = ""; // Insert channel for the discord bot here
    const tRoom = "discord";

    discord?.requireService(
        "tiane_discord",
        async (client) => {
            nodecg.log.info("Discord client has been updated, adding handlers for messages.");
            myChannel = (await client.getRawClient().channels.fetch(dChannel)) as TextChannel;
            client.getRawClient().on("message", (msg) => {
                if (myTiane != null && myChannel != null && myDiscord != null) {
                    if (msg.channel.id == myChannel.id && msg.author.id != myDiscord.getRawClient().user?.id) {
                        const text = msg.content;
                        const user = msg.author.username;
                        userMap[user] = `<@!${msg.author.id}>`;
                        const explicit = msg.mentions.has(myDiscord.getRawClient().user as User);
                        myTiane.getRawClient().send(text, user, tRoom, "USER", explicit);
                    }
                }
            });
            myDiscord = client;
        },
        () => {
            nodecg.log.info("Discord client has been unset.");
            myDiscord = null;
            myChannel = null;
        },
    );

    const tiane = (nodecg.extensions["nodecg-io-tiane"] as unknown) as ServiceProvider<TianeServiceClient> | undefined;

    tiane?.requireService(
        "tiane_discord",
        (client) => {
            nodecg.log.info("Tiane client has been updated, adding handlers for messages.");
            client.getRawClient().onsay(tRoom, (text, user) => {
                if (myChannel != null && myDiscord != null) {
                    if (user == null || !(user in userMap)) {
                        myChannel.send({
                            content: text,
                        });
                    } else {
                        myChannel.send({
                            content: `${userMap[user]} ${text}`,
                        });
                    }
                }
            });
            client.getRawClient().newRoom(tRoom, false);
            client.getRawClient().roomOutput(tRoom, "discord");
            myTiane = client;
        },
        () => {
            nodecg.log.info("Tiane client has been unset.");
            myTiane = null;
        },
    );
};
