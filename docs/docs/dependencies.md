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
object  nodecg_io_intellij {
[[https://github.com/codeoverflow-org/nodecg-io/tree/master/nodecg-io-intellij nodecg-io-intellij]]
}
object  node_fetch {
[[https://www.npmjs.com/package/node-fetch node-fetch]]
}
object  nodecg_io_rcon {
[[https://github.com/codeoverflow-org/nodecg-io/tree/master/nodecg-io-rcon nodecg-io-rcon]]
}
object  rcon_client {
[[https://www.npmjs.com/package/rcon-client rcon-client]]
}
object  nodecg_io_spotify {
[[https://github.com/codeoverflow-org/nodecg-io/tree/master/nodecg-io-spotify nodecg-io-spotify]]
}
object  open {
[[https://www.npmjs.com/package/open open]]
}
object  spotify_web_api_node {
[[https://www.npmjs.com/package/spotify-web-api-node spotify-web-api-node]]
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
object  nodecg_io_ws_client {
[[https://github.com/codeoverflow-org/nodecg-io/tree/master/nodecg-io-ws-client nodecg-io-ws-client]]
}
object  types_ws {
[[https://www.npmjs.com/package/@types/ws @types/ws]]
}
object  ws {
[[https://www.npmjs.com/package/ws ws]]
}
object  nodecg_io_ws_server {
[[https://github.com/codeoverflow-org/nodecg-io/tree/master/nodecg-io-ws-server nodecg-io-ws-server]]
}
nodecg_io_core ...> ajv
nodecg_io_core ...> crypto_js
nodecg_io_core ...> tslib
nodecg_io_core ...> typescript
nodecg_io_discord --> nodecg_io_core
nodecg_io_discord ...> discord_js
nodecg_io_intellij --> nodecg_io_core
nodecg_io_intellij ...> node_fetch
nodecg_io_rcon --> nodecg_io_core
nodecg_io_rcon ...> rcon_client
nodecg_io_spotify --> nodecg_io_core
nodecg_io_spotify ...> open
nodecg_io_spotify ...> spotify_web_api_node
nodecg_io_twitch --> nodecg_io_core
nodecg_io_twitch ...> twitch
nodecg_io_twitch ...> twitch_chat_client
nodecg_io_ws_client --> nodecg_io_core
nodecg_io_ws_client ...> types_ws
nodecg_io_ws_client ...> ws
nodecg_io_ws_server --> nodecg_io_core
nodecg_io_ws_server ...> types_ws
nodecg_io_ws_server ...> ws
::end-uml::
