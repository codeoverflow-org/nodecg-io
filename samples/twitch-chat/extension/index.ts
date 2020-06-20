import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { TwitchServiceClient } from "nodecg-io-twitch/extension";
global.fetch = require("node-fetch");


module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for twitch started");

    // This implicit cast determines the client type in the requireService call
    const twitch: ServiceProvider<TwitchServiceClient> | undefined = nodecg.extensions["nodecg-io-twitch"] as any;

    // Hardcoded channels for testing purposes.
    // Note that this does need a # before the channel name and is case-insensitive.
    const twitchChannels = ["#derniklaas"];

    twitch?.requireService("sample", (client) => {
        nodecg.log.info("Twitch client has been updated, adding handlers for messages.");

        twitchChannels.forEach((channel) => {
            addListeners(nodecg, client, channel);
        });
    }, () => nodecg.log.info("Twitch client has been unset."));
};

function addListeners(nodecg: NodeCG, client: TwitchServiceClient, channel: string) {
    const tw = client.getRawClient();

    tw.join(channel)
        .then(() => {
            let emotes = {

            }

            nodecg.log.info(`Connected to twitch channel "${channel}"`)
            tw.onPrivmsg(async (chan, user, message, msg) => {
                if (chan === channel.toLowerCase()) {
                    msg.parseEmotes().forEach(emote => {
                        const emotestr = emote.name;
                        if (emotestr in emotes) {
                            emotes[emotestr] += 1
                        } else {
                            emotes[emotestr] = 1
                        }
                    })
                    if (message.toLocaleLowerCase() == '!emotecounter') {
                        let nmsg = `@${user}`
                        Object.keys(emotes).forEach(emote  => {
                            if (emote != 'undefined') {
                                nmsg += `, ${emote}: ${emotes[emote]}`
                            }
                        })
                        tw.say(channel, nmsg);
                    }
                    if (message.toLocaleLowerCase() == '!issues') {
                        let amount = 0
                        let nik = 0
                        await fetch('https://api.github.com/repos/codeoverflow-org/nodecg-io/issues').then(async answer => {
                            await answer.json().then(json => {
                                json.forEach((item) => {
                                if ((item.state.toLowerCase() == 'open' || item.state.toLowerCase() == 'draft') && !('pull_request' in item)) {
                                    amount += 1
                                    if (item.user.login.toLowerCase() == 'derniklaas') {
                                        nik += 1
                                    }
                                }
                            });
                            });
                        })
                        tw.say(channel, `nodecg-io has ${amount} open issues requests. ${nik} are by derNiklaas.`)
                    }
                    if (message.toLocaleLowerCase() == '!pulls') {
                        let amount = 0
                        let nik = 0
                        await fetch('https://api.github.com/repos/codeoverflow-org/nodecg-io/pulls').then(async answer => {
                            await answer.json().then(json => {
                                json.forEach((item) => {
                                if (item.state.toLowerCase() == 'open' || item.state.toLowerCase() == 'draft') {
                                    amount += 1
                                    if (item.user.login.toLowerCase() == 'derniklaas') {
                                        nik += 1
                                    }
                                }
                            });
                            });
                        })
                        tw.say(channel, `nodecg-io has ${amount} open pull requests. ${nik} are by derNiklaas.`)
                    }
                }
            });
            tw.say(channel, "Dynamic Emote-Counter without undefined + Pull Request & Issues Info is now active. Use !emotecounter, !issues or !pulls");
        })
        .catch((reason) => {
            nodecg.log.error(`Couldn't connect to twitch: ${reason}.`);
            nodecg.log.info(`Retrying in 5 seconds.`);
            setTimeout(() => addListeners(nodecg, client, channel), 5000);
        });
}
