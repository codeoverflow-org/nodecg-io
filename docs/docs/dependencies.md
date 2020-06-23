<!-- This file is auto-generated. Do not change anything here -->
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
::end-uml::
