import { NodeCG } from "nodecg/types/server";
import { ServiceClient } from "nodecg-io-core/extension/types";
import { emptySuccess, error, Result, success } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { v4 as ipv4 } from "is-ip";
import { v3 } from "node-hue-api";
// eslint-disable-next-line @typescript-eslint/no-unused-vars-experimental
import HueApi = require("node-hue-api/lib/api/Api");
const { api, discovery } = v3;

const deviceName = "nodecg-io";
const name = "philipshue";

interface PhilipsHueServiceConfig {
    discover: boolean;
    ipAddr: string;
    port: number;
    username?: string;
    apiKey?: string;
}

export type PhilipsHueServiceClient = ServiceClient<HueApi>;

module.exports = (nodecg: NodeCG) => {
    new PhilipsHueService(nodecg, "philips-hue", __dirname, "../philipshue-schema.json").register();
};

class PhilipsHueService extends ServiceBundle<PhilipsHueServiceConfig, PhilipsHueServiceClient> {
    async validateConfig(config: PhilipsHueServiceConfig): Promise<Result<void>> {
        const { discover, port, ipAddr } = config;

        if (!config) {
            // config could not be found
            return error("No config found!");
        } else if (!discover) {
            // check the ip address if its there
            if (ipAddr && !ipv4(ipAddr)) {
                return error("Invalid IP address, can handle only IPv4 at the moment");
            }

            // discover is not set but there is no ip address
            return error("discover isn't true there is no IP address!");
        } else if (port && !(0 <= port && port <= 65535)) {
            // the port is there but the port is wrong
            return error("Your port is not between 0 and 65535!");
        }

        // YAY! the config is good
        return emptySuccess();
    }

    async createClient(config: PhilipsHueServiceConfig): Promise<Result<PhilipsHueServiceClient>> {
        if (config.discover) {
            const discIP = await this.discoverBridge();
            if (discIP) {
                config.ipAddr = discIP;
                config.discover = false;
            } else {
                return error("could not discover your Hue Bridge, maybe try specifying a specific IP!");
            }
        }

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
                            "for the one who is seeing this in the console, you need to press the big button on the bridge for creating an bundle/instance",
                    );
                } else {
                    return error(`Unexpected Error: ${err.message}`);
                }
            }
        }

        // Create a new API instance that is authenticated with the new user we created
        const client = await api.createLocal(ipAddr, port).connect(config.username, config.apiKey);

        return success({
            getNativeClient() {
                return client;
            },
        });
    }

    stopClient(_client: PhilipsHueServiceClient) {
        // Not supported from the client
    }

    private async discoverBridge() {
        const discoveryResults = await discovery.nupnpSearch();

        if (discoveryResults.length === 0) {
            console.error("Failed to resolve any Hue Bridges");
            return null;
        } else {
            // Ignoring that you could have more than one Hue Bridge on a network as this is unlikely in 99.9% of users situations
            return discoveryResults[0].ipaddress as string;
        }
    }
}
