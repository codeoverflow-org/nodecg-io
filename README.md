# nodecg-io

[![Feature Requests](https://img.shields.io/github/issues/codeoverflow-org/nodecg-io/enhancement?label=Feature%20Requests&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/labels/enhancement)
[![Bugs](https://img.shields.io/github/issues/codeoverflow-org/nodecg-io/bug?label=Bugs&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/labels/bug)
[![Pull Requests](https://img.shields.io/github/issues-pr/codeoverflow-org/nodecg-io?label=Pull%20Requests&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/pulls)
[![Services](https://img.shields.io/static/v1?label=Services%20implemented&message=18&color=blue&style=flat-square)](https://nodecg.io/services/)
[![License](https://img.shields.io/github/license/codeoverflow-org/nodecg-io?label=License&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/blob/master/LICENSE)
[![Discord](https://img.shields.io/badge/discord-join-7289DA.svg?logo=discord&style=flat-square)](https://discord.gg/sX2Gjbs/)

**A NodeCG-bundle which will implement Social Media API's in the NodeCG framework**

> Development status: framework mostly implemented  
> Services implemented: see list below

## About nodecg-io

nodecg-io is the successor of [ChatOverflow](https://github.com/codeoverflow-org/chatoverflow). The aim of this bundle is to simplify the code and expand the number of integrated services. The main goal is to increase the number of supported APIs to save you development time.

## Implemented Services and Interfaces

-   [x] AutoHotkey
-   [x] Discord
-   [x] IntelliJ IDEs
-   [x] IRC (Internet Relay Chat)
-   [x] MIDI Input
-   [x] MIDI Output
-   [x] Philips Hue
-   [x] RCON
-   [ ] Serial Port (Arduino)
-   [x] Slack WebAPI
-   [x] Spotify
-   [x] Elgato Stream Deck
-   [ ] StreamElements
-   [x] Telegram
-   [ ] TipeeeStream
-   [x] Twitch Chat
-   [x] Twitter
-   [x] WebSocket Client
-   [x] WebSocket Server
-   [x] Xdotool
-   [x] YouTube

## How to use nodecg-io

If you want to use nodecg-io, you should note that it is only a framework for your bundle, so you need at least a basic knowledge of the programming language JavaScript or any other language that compiles to JavaScript like TypeScript.
If that's no problem you can head over to the [installation guide](https://nodecg.io/getting_started/install/) and take a look at the [available nodecg-io services](https://nodecg.io/services/).

## How to contribute

If you want to contribute to this bundle you can implement one of those services or fix an [issue](https://github.com/codeoverflow-org/nodecg-io/issues). Before contributing head over to the [How to contribute](https://nodecg.io/contribute/contribute/) - Guide.

## Code Overflow Team

> <img src="https://avatars.githubusercontent.com/daniel0611"   height="50px" title="Daniel Huber"/> | [`@daniel0611`](https://github.com/daniel0611)

> <img src="https://avatars.githubusercontent.com/joblo2213"    height="50px" title="Jonas"/> | [`@joblo2213`](https://github.com/joblo2213)

> <img src="https://avatars.githubusercontent.com/sebinside"    height="50px" title="Sebastian"/> | [`@sebinside`](https://github.com/sebinside)

> <img src="https://avatars.githubusercontent.com/Promasu"    height="50px" title="Adrian"/> | [`@Promasu`](https://github.com/Promasu)

P.S.: If you have some spare time to help out around here, we would be delighted to add your name to this list!

# Repository structure

```
nodecg-io/
+--docs/                         Documentation Repo (clone separately)
+--nodecg-io-ahk/                AutoHotkey integration
+--nodecg-io-core/               Core Lib
   +--dashboard/                    GUI
+--nodecg-io-discord/            Discord integration
+--nodecg-io-intellij/           IntelliJ integration
+--nodecg-io-irc/                IRC integration
+--nodecg-io-midi-input/         MIDI input integration
+--nodecg-io-midi-output/        MIDI output integration
+--nodecg-io-philipshue/         Philips Hue integration
+--nodecg-io-rcon/               Rcon integration
+--nodecg-io-slack/              Slack WebAPI Integration
+--nodecg-io-spotify/            Spotify integration
+--nodecg-io-streamdeck/         Elgato Stream Deck integration
+--nodecg-io-telegram/           Telegram integration
+--nodecg-io-twitch/             Twitch integration
+--nodecg-io-twitter/            Twitter integration
+--nodecg-io-websocket-client/   WebSocket client integration
+--nodecg-io-websocket-server/   WebSocket server integration
+--nodecg-io-xdotool/            Xdotool integration
+--nodecg-io-youtube/            YouTube integration
+--samples/                      Samplecode
   +--ahk-sendcommand/              AutoHotKey Samplecode
   +--discord-guild-chat/           Discord Samplecode
   +--intellij-integration/         IntelliJ Samplecode
   +--philipshue-lights/            Philips Hue Samplecode
   +--slack-post/                   Slack WebAPI Samplecodes
   +--streamdeck-rainbow/           Streamdeck Samplecode
   +--streamelements-events/        Streamelements Samplecode
   +--telegram-bot/                 Telegram Samplecode
   +--twitch-chat/                  Twitch Samplecode
   +--twitter-timeline/             Twitter Samplecode
   +--ws-server/                    Websocket Server Samplecode
   +--xdotool-sample/               xdotool Samplecode
   +--youtube-playlist/             YouTube Samplecode
```
