# Dependency Graph

::uml:: format="svg_inline" classes="uml" alt="PlantUML dependency graph" title="PlantUML dependency graph"
object  nodecg_io_core {
[[https://github.com/codeoverflow-org/nodecg-io/tree/master/nodecg-io-core nodecg-io-core]]
}
object  ajv {
[[https://www.npmjs.com/package/ajv ajv]]
}
object  crypto_js {
[[https://www.npmjs.com/package/crypto-js crypto-js]]
}
object  tslib {
[[https://www.npmjs.com/package/tslib tslib]]
}
object  typescript {
[[https://www.npmjs.com/package/typescript typescript]]
}
object  nodecg_io_discord {
[[https://github.com/codeoverflow-org/nodecg-io/tree/master/nodecg-io-discord nodecg-io-discord]]
}
object  discord_js {
[[https://www.npmjs.com/package/discord.js discord.js]]
}
object  nodecg_io_rcon {
[[https://github.com/codeoverflow-org/nodecg-io/tree/master/nodecg-io-rcon nodecg-io-rcon]]
}
object  rcon_client {
[[https://www.npmjs.com/package/rcon-client rcon-client]]
}
object  nodecg_io_twitch {
[[https://github.com/codeoverflow-org/nodecg-io/tree/master/nodecg-io-twitch nodecg-io-twitch]]
}
object  twitch {
[[https://www.npmjs.com/package/twitch twitch]]
}
object  twitch_chat_client {
[[https://www.npmjs.com/package/twitch-chat-client twitch-chat-client]]
}
object  samples_twitch_chat {
[[https://github.com/codeoverflow-org/nodecg-io/tree/master/samples/twitch-chat twitch-chat]]
}
object  types_node {
[[https://www.npmjs.com/package/@types/node @types/node]]
}
object  nodecg {
[[https://www.npmjs.com/package/nodecg nodecg]]
}
object  node_fetch {
[[https://www.npmjs.com/package/node-fetch node-fetch]]
}
object  types_node_fetch {
[[https://www.npmjs.com/package/@types/node-fetch @types/node-fetch]]
}
nodecg_io_core ...> ajv
nodecg_io_core ...> crypto_js
nodecg_io_core ...> tslib
nodecg_io_core ...> typescript
nodecg_io_discord --> nodecg_io_core
nodecg_io_discord ...> discord_js
nodecg_io_rcon --> nodecg_io_core
nodecg_io_rcon ...> rcon_client
nodecg_io_twitch --> nodecg_io_core
nodecg_io_twitch ...> twitch
nodecg_io_twitch ...> twitch_chat_client
samples_twitch_chat --> nodecg_io_twitch
samples_twitch_chat --> nodecg_io_core
samples_twitch_chat ...> types_node
samples_twitch_chat ...> nodecg
samples_twitch_chat ...> typescript
samples_twitch_chat ...> node_fetch
samples_twitch_chat ...> types_node_fetch
::end-uml::
