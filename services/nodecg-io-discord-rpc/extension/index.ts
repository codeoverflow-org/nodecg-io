import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { DiscordRpcConfig, createLoginData } from "./discordRpcAuth";
import * as rpc from "discord-rpc";

export type DiscordRpcClient = rpc.Client;

module.exports = (nodecg: NodeCG) => {
    new DiscordRpcService(nodecg, "discord-rpc", __dirname, "../schema.json").register();
};

class DiscordRpcService extends ServiceBundle<DiscordRpcConfig, DiscordRpcClient> {
    async validateConfig(config: DiscordRpcConfig): Promise<Result<void>> {
        const client = new rpc.Client({ transport: "ipc" });
        const login = await createLoginData(client, config, ["identify", "rpc"]);
        await client.login(login);
        await client.destroy();
        return emptySuccess();
    }

    async createClient(config: DiscordRpcConfig): Promise<Result<DiscordRpcClient>> {
        const client = new rpc.Client({ transport: "ipc" });
        const login = await createLoginData(client, config, ["identify", "rpc"]);
        await client.login(login);
        this.nodecg.log.info("Successfully created discord-rpc client.");
        return success(client);
    }

    stopClient(client: DiscordRpcClient): void {
        client.destroy().then((_) => this.nodecg.log.info("Successfully stopped discord-rpc client."));
    }

    removeHandlers(client: DiscordRpcClient): void {
        client.removeAllListeners();
    }
}
