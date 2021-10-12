# nodecg-io

[![Feature Requests](https://img.shields.io/github/issues/codeoverflow-org/nodecg-io/enhancement?label=Feature%20Requests&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/labels/enhancement)
[![Bugs](https://img.shields.io/github/issues/codeoverflow-org/nodecg-io/bug?label=Bugs&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/labels/bug)
[![Pull Requests](https://img.shields.io/github/issues-pr/codeoverflow-org/nodecg-io?label=Pull%20Requests&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/pulls)
[![Services](https://img.shields.io/static/v1?label=Services%20implemented&message=33&color=blue&style=flat-square)](https://nodecg.io/RELEASE/services/)
[![License](https://img.shields.io/github/license/codeoverflow-org/nodecg-io?label=License&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/blob/master/LICENSE)
[![Discord](https://img.shields.io/badge/discord-join-7289DA.svg?logo=discord&style=flat-square)](https://discord.gg/GEJzxBGRu6)

**A NodeCG-bundle which implements Social Media API's in the NodeCG framework**

## About nodecg-io

nodecg-io is the successor of [ChatOverflow](https://github.com/codeoverflow-org/chatoverflow). The aim of this bundle is to simplify the code and expand the number of integrated services. The main goal is to increase the number of supported APIs to save you development time.

## Implemented Services and Interfaces

- Android (using adb)
- ArtNet
- AutoHotkey
- CurseForge
- DBus
- Discord
- Discord RPC
- Elgato lights
- GitHub
- Google Apis
- IntelliJ IDEs
- IRC (Internet Relay Chat)
- MIDI Input
- MIDI Output
- Nanoleafs
- OBS
- Philips Hue
- RCON
- Reddit
- sACN Receiver
- sACN Sender
- Serial Port (Arduino)
- Slack WebAPI
- Spotify
- SQL (using [knex](https://knexjs.org/))
- Elgato Stream Deck
- StreamElements
- Telegram
- TIANE
- Twitch Addons
- Twitch API
- Twitch Chat
- Twitch PubSub
- Twitter
- WebSocket Client
- WebSocket Server
- Xdotool

## How to use nodecg-io

If you want to use nodecg-io, you should note that it is only a framework for your bundle, so you need at least a basic knowledge of the programming language JavaScript or any other language that compiles to JavaScript like TypeScript.
If that's no problem you can head over to the [installation guide](https://nodecg.io/RELEASE/getting_started/install/) and take a look at the [available nodecg-io services](https://nodecg.io/RELEASE/services/).

## How to contribute

If you want to contribute to this bundle you can implement one of those services or fix an [issue](https://github.com/codeoverflow-org/nodecg-io/issues). Before contributing head over to the [How to contribute](https://nodecg.io/RELEASE/contribute/contribute/) guide.

## Code Overflow Team

> <img src="https://avatars.githubusercontent.com/daniel0611"   height="50px" title="Daniel Huber"/> | [`@daniel0611`](https://github.com/daniel0611)

> <img src="https://avatars.githubusercontent.com/joblo2213"    height="50px" title="Jonas"/> | [`@joblo2213`](https://github.com/joblo2213)

> <img src="https://avatars.githubusercontent.com/sebinside"    height="50px" title="Sebastian"/> | [`@sebinside`](https://github.com/sebinside)

> <img src="https://avatars.githubusercontent.com/Promasu"    height="50px" title="Adrian"/> | [`@Promasu`](https://github.com/Promasu)

P.S.: If you have some spare time to help out around here, we would be delighted to add your name to this list!

# Repository structure

```
nodecg-io/
+--docs/                         Documentation repo (you have to clone this separately)
+--nodecg-io-core/               Core framework
   +--dashboard/                    GUI
+--nodecg-io-<service name>/     Service implementations
+--samples/                      Samplecode that shows how each service is used
+--utils/                        Utility packages for shared code between services
```
