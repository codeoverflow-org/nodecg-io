import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
export { ArtNetServiceClient } from "./artnetServiceClient";
import { ArtNetServiceClient } from "./artnetServiceClient";

export interface ArtNetServiceConfig {
    host: string;
    port?: number | string;
    refresh?: number | string;
    iface?: string;
    sendAll?: boolean;
}

module.exports = (nodecg: NodeCG) => {
    new ArtNetService(nodecg, "artnet", __dirname, "../artnet-schema.json").register();
};

class ArtNetService extends ServiceBundle<ArtNetServiceConfig, ArtNetServiceClient> {
    async validateConfig(): Promise<Result<void>> {
        return emptySuccess();
    }

    async createClient(config: ArtNetServiceConfig): Promise<Result<ArtNetServiceClient>> {
        const client = new ArtNetServiceClient(config);

        return success(client);
    }

    stopClient(client: ArtNetServiceClient): void {
        client.close();
        this.nodecg.log.info("Successfully stopped the Art-Net service.");
    }

    removeHandlers(client: ArtNetServiceClient): void {
        client.removeAllListeners();
    }
}
