import { NodeCG } from "nodecg-types/types/server";
import { requireService } from "nodecg-io-core";
import { DiscordServiceClient } from "nodecg-io-discord";
import { TianeServiceClient } from "nodecg-io-tiane";
import { TextChannel, User } from "discord.js";

/*
 * Adds a discord bot that is powered by TIANE. Ping it if you wan't to talk to her.
 */

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for discord started");

    let myDiscord: DiscordServiceClient | null = null;
    let myChannel: TextChannel | null = null;
    let myTiane: TianeServiceClient | null = null;
    const userMap: Record<string, string> = {};

    const discord = requireService<DiscordServiceClient>(nodecg, "discord");

    const discordChannel = ""; // Insert channel for the discord bot here
    const tianeRoom = "discord";

    discord?.onAvailable(async (client) => {
        nodecg.log.info("Discord client has been updated, adding handlers for messages.");
        myChannel = (await client.channels.fetch(discordChannel)) as TextChannel;
        client.on("message", (msg) => {
            if (myTiane !== null && myChannel !== null && myDiscord !== null) {
                if (msg.channel.id === myChannel.id && msg.author.id !== myDiscord.user?.id) {
                    const text = msg.content;
                    const user = msg.author.username;
                    userMap[user] = `<@!${msg.author.id}>`;
                    const explicit = msg.mentions.has(myDiscord.user as User);
                    myTiane.send(text, user, tianeRoom, "USER", explicit);
                }
            }
        });
        myDiscord = client;
    });
    discord?.onUnavailable(() => {
        nodecg.log.info("Discord client has been unset.");
        myDiscord = null;
        myChannel = null;
    });

    const tiane = requireService<TianeServiceClient>(nodecg, "tiane");

    tiane?.onAvailable((client) => {
        nodecg.log.info("Tiane client has been updated, adding handlers for messages.");
        client.onsay(tianeRoom, (text, user) => {
            if (myChannel !== null && myDiscord !== null) {
                if (user === null || !(user in userMap)) {
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
        client.newRoom(tianeRoom, false);
        client.roomOutput(tianeRoom, "discord");
        myTiane = client;
    });
    tiane?.onUnavailable(() => {
        nodecg.log.info("Tiane client has been unset.");
        myTiane = null;
    });
};
