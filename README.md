# nodecg-io

[![Feature Requests](https://img.shields.io/github/issues/codeoverflow-org/nodecg-io/enhancement?label=Feature%20Requests&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/labels/enhancement)
[![Bugs](https://img.shields.io/github/issues/codeoverflow-org/nodecg-io/bug?label=Bugs&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/labels/bug)
[![Pull Requests](https://img.shields.io/github/issues-pr/codeoverflow-org/nodecg-io?label=Pull%20Requests&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/labels/bug)
[![Sevices](https://img.shields.io/static/v1?label=Services%20implemented&message=5&color=blue&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/labels/bug)
![License](https://img.shields.io/github/license/codeoverflow-org/nodecg-io?label=License&style=flat-square)

**A NodeCG-bundle which will implement Social Media API's in the NodeCG framework**  
>Development status: framework mostly implemented   
>Services implemented: Twitch chat, RCON, Discord

## About nodecg-io

nodecg-io is the successor of [ChatOverflow](https://github.com/codeoverflow-org/chatoverflow). The aim of this bundle is to simplify the code and expand the number of integrated services. However, the main goal is still to carry out the API integration for you and thus to save you development time.

## Implemented Services and Interfaces

- [ ] AHK
- [x] Discord  
- [ ] IRC (Internet Relay Chat)
- [ ] MIDI
- [x] RCON  
- [ ] Serial Port (Arduino)  
- [ ] Spotify
- [ ] StreamElements  
- [ ] TipeeeStream  
- [x] Twitch Chat  
- [ ] Twitter
- [X] WebSocket Client & Server
- [ ] Youtube

## How to use nodecg-io

If you want to use nodecg-io, you should note that it is only a framework for your bundle, so you need at least a basic knowledge of the programming language Javascript or any other language that compiles to Javascript like Typescript. 
If thats no problem you can had over to the [Installationguide](https://github.com/codeoverflow-org/nodecg-io/blob/master/docs/install.md) and then look at the [sample bundle](https://github.com/codeoverflow-org/nodecg-io/tree/master/samples/) for your selected service.

## How to contribute
 If you wat to contribute to this bundle you can implement one of this services or fix an [issue](https://github.com/codeoverflow-org/nodecg-io/issues). Before contributing had over to the [How to contribute](https://github.com/codeoverflow-org/nodecg-io/blob/master/docs/contribute.md) - Guide.

## Code Overflow Team

> <img src="https://avatars.githubusercontent.com/daniel0611"   height="50px" title="Daniel Huber"/>   | [`@daniel0611`](https://github.com/daniel0611)

> <img src="https://avatars.githubusercontent.com/joblo2213"    height="50px" title="Jonas"/>          | [`@joblo2213`](https://github.com/joblo2213)

> <img src="https://avatars.githubusercontent.com/sebinside"    height="50px" title="Sebastian"/>      | [`@sebinside`](https://github.com/sebinside)

P.S.: If you have some spare time to help out around here, we would be delighted to add your name to this list!


# Repository structure

```
nodecg-io/
+--docs/                   Documentation
+--nodecg-io-core/         Core Lib
   +--dashbord/            GUI
+--nodecg-io-discord/      Discord integration
+--nodecg-io-rcon/         Rcon integration
+--nodecg-io-twitch/       Twitch integration
+--samples/                Samplecode
   +--twitch-chat/         Twitch Samplecode
```