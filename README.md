# :warning: nodecg-io is abandoned
This project is no longer actively maintained and is archived.
The domain [nodecg.io](https://codeoverflow-org.github.io/nodecg-io-docs/RELEASE/) is also not available anymore.
Use this project at your own risk - breaking APIs and security vulnerabilities are expected to happen soon.
If you wish to continue nodecg-io, please fork it.

# nodecg-io

[![Feature Requests](https://img.shields.io/github/issues/codeoverflow-org/nodecg-io/enhancement?label=Feature%20Requests&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/labels/enhancement)
[![Bugs](https://img.shields.io/github/issues/codeoverflow-org/nodecg-io/bug?label=Bugs&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/labels/bug)
[![Pull Requests](https://img.shields.io/github/issues-pr/codeoverflow-org/nodecg-io?label=Pull%20Requests&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/pulls)
[![Services](https://img.shields.io/static/v1?label=Services%20implemented&message=39&color=blue&style=flat-square)](https://codeoverflow-org.github.io/nodecg-io-docs/RELEASE/services/)
[![License](https://img.shields.io/github/license/codeoverflow-org/nodecg-io?label=License&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/blob/main/LICENSE)
[![Discord](https://img.shields.io/badge/discord-join-7289DA.svg?logo=discord&style=flat-square)](https://discord.gg/GEJzxBGRu6)

**A NodeCG-bundle which implements Social Media API's in the NodeCG framework**

## About nodecg-io

nodecg-io is the successor of [ChatOverflow](https://github.com/codeoverflow-org/chatoverflow). The aim of this bundle is to simplify the code and expand the number of integrated services. The main goal is to increase the number of supported APIs to save you development time.

## Implemented Services and Interfaces

<details>
  <summary>Click to see more!</summary>

- AutoHotkey
- Android (using adb)
- Art-Net
- Atem
- DBus
- Discord
- Discord RPC
- Elgato lights
- [GameTTS](https://github.com/lexkoro/GameTTS)
- GitHub
- Google APIs
- Google Cast
- IntelliJ IDEs
- IRC (Internet Relay Chat)
- MIDI Input
- MIDI Output
- MQTT
- Nanoleafs
- OBS
- [OpenTTS](https://github.com/synesthesiam/opentts)
- Philips Hue
- [PiShock](https://pishock.com)
- RCON
- Reddit
- sACN Receiver
- sACN Sender
- Serial Port (Arduino)
- [Shlink](https://shlink.io/)
- Slack Web API
- Spotify
- SQL (using [knex](https://knexjs.org/))
- Elgato Stream Deck
- StreamElements
- Telegram
- TIANE
- Twitch Add-ons
- Twitch API
- Twitch Chat
- Twitch PubSub
- Twitter
- WebSocket Client
- WebSocket Server
- Xdotool

</details>

## How to use nodecg-io

If you want to use nodecg-io, you should note that it is only a framework for your bundle, so you need at least a basic knowledge of the programming language JavaScript or any other language that compiles to JavaScript like TypeScript.
If that's no problem you can head over to the [installation guide](https://codeoverflow-org.github.io/nodecg-io-docs/RELEASE/getting_started/install/) and take a look at the [available nodecg-io services](https://codeoverflow-org.github.io/nodecg-io-docs/RELEASE/services/).

## How to contribute

If you want to contribute to this bundle you can implement one of those services or fix an [issue](https://github.com/codeoverflow-org/nodecg-io/issues). Before contributing head over to the [How to contribute](https://codeoverflow-org.github.io/nodecg-io-docs/RELEASE/contribute/contribute/) guide.

# Repository structure

```
nodecg-io/
+--docs/                          Documentation repo (you have to clone this separately)
+--nodecg-io-core/                Core framework
   +--dashboard/                  GUI
+--services/
   +--nodecg-io-<service name>/   Service implementations
+--samples/                       Samplecode that shows how each service is used
+--utils/                         Utility packages for shared code between services
```
