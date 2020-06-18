# nodecg-io

[![Feature Requests](https://img.shields.io/github/issues/codeoverflow-org/nodecg-io/enhancement?label=Feature%20Requests&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/labels/enhancement)
[![Bugs](https://img.shields.io/github/issues/codeoverflow-org/nodecg-io/bug?label=Bugs&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/labels/bug)
[![Pull Requests](https://img.shields.io/github/issues-pr/codeoverflow-org/nodecg-io?label=Pull%20Requests&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/labels/bug)
[![Sevices](https://img.shields.io/static/v1?label=Services%20implemented&message=2&color=blue&style=flat-square)](https://github.com/codeoverflow-org/nodecg-io/labels/bug)
![License](https://img.shields.io/github/license/codeoverflow-org/nodecg-io?label=License&style=flat-square)

** A NodeCG-bundle which will implement Social Media API's in the NodeCG framework **  
Development status: framework mostly implemented; services: twitch chat, RCON

## About nodecg-io

NodeCG-io is the successor of ChatOverflow. The aim of this bundle is to simplify the ChatOverflow and expand the number of integrated services. However, the main goal is still to carry out the API integration for you and thus to save you development time.

## Implemented Services and Interfaces

- [ ] AHK
- [ ] Discord  
- [ ] IRC (Internet Relay Chat)
- [ ] MIDI
- [x] RCON  
- [ ] Serial Port (Arduino)  
- [ ] Spotify
- [ ] StreamElements  
- [ ] TipeeeStream  
- [x] Twitch Chat  
- [ ] Twitter
- [ ] Youtube

## How to use nodecg-io

If you want to use nodecg-io, you should note that it is only a framework for your bundle, so you need at least a basic knowledge of the programming language Javascript or any other language that compiles to Javascript like Typescript. 
If thats no problem you can had over to the 
[Installationguide]() 
and then look at the sample bundle for your selected service.


8. Code Overflow Team

> <img src="https://avatars.githubusercontent.com/daniel0611"   height="50px" title="Daniel Huber"/>   | [`@daniel0611`](https://github.com/daniel0611)

> <img src="https://avatars.githubusercontent.com/joblo2213"    height="50px" title="Jonas"/>          | [`@joblo2213`](https://github.com/joblo2213)

 ><img src="https://avatars.githubusercontent.com/sebinside"    height="50px" title="Sebastian"/>      | [`@sebinside`](https://github.com/sebinside)

P.S.: If you have some spare time to help out around here, we would be delighted to add your name to this list!


# Repository structure

```
nodecg-io/
+--docs/                   Documentaion
   +--services/            Per service docs
+--nodecg-io-core/         Core Lib
   +--/dashbord/           GUI
+--nodecg-io-twitch/       Twitch integration
+--nodecg-io-rcon/         Rcon integration
+--samples/                Samplecode
   +--twitch-chat/         Twitch Samplecode
```