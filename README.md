# nodecg-io

[![Feature Requests](https://img.shields.io/github/issues/codeoverflow-org/nodecg-io/enhancement?label=Feature%20Requests&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/labels/enhancement)
[![Bugs](https://img.shields.io/github/issues/codeoverflow-org/nodecg-io/bug?label=Bugs&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/labels/bug)
[![Pull Requests](https://img.shields.io/github/issues-pr/codeoverflow-org/nodecg-io?label=Pull%20Requests&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/pulls)
[![Sevices](https://img.shields.io/static/v1?label=Services%20implemented&message=5&color=blue&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/blob/master/docs/docs/services.md)
[![License](https://img.shields.io/github/license/codeoverflow-org/nodecg-io?label=License&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/blob/master/LICENSE)

**A NodeCG-bundle which will implement Social Media API's in the NodeCG framework**  
>Development status: framework mostly implemented   
>Services implemented: Twitch chat, RCON, Discord, WebSocket Client & Server

## About nodecg-io

nodecg-io is the successor of [ChatOverflow](https://github.com/codeoverflow-org/chatoverflow). The aim of this bundle is to simplify the code and expand the number of integrated services. However, the main goal is still to carry out the API integration for you and thus to save you development time.

## Implemented Services and Interfaces

- [X] AHK
- [x] Discord  
- [ ] IRC (Internet Relay Chat)
- [ ] IntelliJ IDEs
- [ ] MIDI
- [x] RCON  
- [ ] Serial Port (Arduino)  
- [X] Spotify
- [ ] StreamElements  
- [ ] TipeeeStream  
- [x] Twitch Chat  
- [X] Twitter
- [X] WebSocket Client & Server
- [ ] YouTube

## How to use nodecg-io

If you want to use nodecg-io, you should note that it is only a framework for your bundle, so you need at least a basic knowledge of the programming language JavaScript or any other language that compiles to JavaScript like TypeScript. 
If thats no problem you can had over to the [installation guide](https://nodecg.io/install/) and then have a look at the [available nodecg-io services](https://nodecg.io/services/). 

## How to contribute
If you want to contribute to this bundle you can implement one of this services or fix an [issue](https://github.com/codeoverflow-org/nodecg-io/issues). Before contributing had over to the [How to contribute](https://nodecg.io/contribute/) - Guide.

## Code Overflow Team

> <img src="https://avatars.githubusercontent.com/daniel0611"   height="50px" title="Daniel Huber"/>   | [`@daniel0611`](https://github.com/daniel0611)

> <img src="https://avatars.githubusercontent.com/joblo2213"    height="50px" title="Jonas"/>          | [`@joblo2213`](https://github.com/joblo2213)

> <img src="https://avatars.githubusercontent.com/sebinside"    height="50px" title="Sebastian"/>      | [`@sebinside`](https://github.com/sebinside)

P.S.: If you have some spare time to help out around here, we would be delighted to add your name to this list!


# Repository structure

```
nodecg-io/
+--docs/                   Documentation
+--nodecg-io-core/         AHK integration
+--nodecg-io-core/         Core Lib
   +--dashboard/           GUI
+--nodecg-io-discord/      Discord integration
+--nodecg-io-intellij/     IntelliJ integration
+--nodecg-io-rcon/         Rcon integration
+--nodecg-io-spotify/      Spotify integration
+--nodecg-io-twitch/       Twitch integration
+--nodecg-io-twitter/      Twitter integration
+--nodecg-io-ws-client/    WebSocket client integration
+--nodecg-io-ws-server/    WebSocket server integration
+--samples/                Samplecode
   +--discord-guild-chat/  Discord Samplecode
   +--intellij/            IntelliJ Samplecode
   +--twitch-chat/         Twitch Samplecode
   +--twitter-timeline/    Twitter Samplecode
```
