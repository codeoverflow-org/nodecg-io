import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, error, ServiceBundle, ObjectMap } from "nodecg-io-core";
import * as ipv4 from "is-ip";
import { v3 } from "node-hue-api";
import HueApi = require("node-hue-api/lib/api/Api");
const { api, discovery } = v3;

const deviceName = "nodecg-io";
const name = "philipshue";

interface PhilipsHueServiceConfig {
    ipAddr: string;
    port?: number;
    username?: string;
    apiKey?: string;
}

export type PhilipsHueServiceClient = HueApi;

module.exports = (nodecg: NodeCG) => {
    new PhilipsHueService(nodecg, "philipshue", __dirname, "../philipshue-schema.json").register();
};

class PhilipsHueService extends ServiceBundle<PhilipsHueServiceConfig, PhilipsHueServiceClient> {
    presets = {};

    constructor(nodecg: NodeCG, name: string, ...pathSegments: string[]) {
        super(nodecg, name, ...pathSegments);
        this.discoverBridges()
            .then((bridgePresets) => (this.presets = bridgePresets))
            .catch((err) => nodecg.log.error(`Failed to discover local bridges: ${err}`));
    }

    async validateConfig(config: PhilipsHueServiceConfig): Promise<Result<void>> {
        const { port, ipAddr } = config;

        if (!ipv4.isIPv4(ipAddr)) {
            return error("Invalid IP address, can handle only IPv4 at the moment!");
        } else if (port && !(0 <= port && port <= 65535)) {
            // the port is there but the port is wrong
            return error("Your port is not between 0 and 65535!");
        }

        // YAY! the config is good
        return emptySuccess();
    }

    async createClient(config: PhilipsHueServiceConfig): Promise<Result<PhilipsHueServiceClient>> {
        const { port, username, apiKey, ipAddr } = config;

        // check if there is one thing missing
        if (!username || !apiKey) {
            // Create an unauthenticated instance of the Hue API so that we can create a new user
            const unauthenticatedApi = await api.createLocal(ipAddr, port).connect();

            let createdUser;
            try {
                createdUser = await unauthenticatedApi.users.createUser(name, deviceName);
                // debug output
                // nodecg.log.info(`Hue Bridge User: ${createdUser.username}`);
                // nodecg.log.info(`Hue Bridge User Client Key: ${createdUser.clientkey}`);

                config.username = createdUser.username;
                config.apiKey = createdUser.clientkey;
            } catch (err) {
                if (err.getHueErrorType() === 101) {
                    return error(
                        "The Link button on the bridge was not pressed. Please press the Link button and try again.\n" +
                            "for the one who is seeing this in the console, you need to press the big button on the bridge for creating an bundle/instance!",
                    );
                } else {
                    return error(`Unexpected Error: ${err.message}`);
                }
            }
        }

        // Create a new API instance that is authenticated with the new user we created
        const client = await api.createLocal(ipAddr, port).connect(config.username, config.apiKey);

        return success(client);
    }

    stopClient(_client: PhilipsHueServiceClient) {
        // Not supported from the client
    }

    private async discoverBridges(): Promise<ObjectMap<PhilipsHueServiceConfig>> {
        const results: { ipaddress: string }[] = await discovery.nupnpSearch();

        return Object.fromEntries(
            results.map((bridge) => {
                const ipAddr = bridge.ipaddress;
                const config: PhilipsHueServiceConfig = { ipAddr };
                return [ipAddr, config];
            }),
        );
    }
}
