import { NodeCG } from "nodecg/types/server";
import { NodeCGIOCore } from "nodecg-io-core/extension";
import { Service, ServiceProvider } from "nodecg-io-core/extension/types";
import { Result, emptySuccess, error, success } from "nodecg-io-core/extension/utils/result";
import { v4 as ipv4 } from "is-ip";
import { v3 } from "node-hue-api";
// eslint-disable-next-line @typescript-eslint/no-unused-vars-experimental
import Api = require("node-hue-api/lib/api/Api");
import { UpdateInstanceConfigMessage } from "nodecg-io-core/extension/messageManager";
const { api, discovery } = v3;

const deviceName = "nodecg-io";
const name = "philipshue";

interface PhilipsHueServiceConfig {
    discover: boolean;
    ipAddr?: string;
    port?: number;
    username?: string;
    apiKey?: string;
}

export interface PhilipsHueServiceClient {
    getRawClient(): Api;
}

module.exports = function (nodecg: NodeCG): ServiceProvider<PhilipsHueServiceClient> | undefined {
    nodecg.log.info("Philips Hue bundle started.");
    const core = (nodecg.extensions["nodecg-io-core"] as unknown) as NodeCGIOCore;
    if (!core) {
        nodecg.log.error("nodecg-io-core isn't loaded! Philips Hue bundle won't function without it.");
        return undefined;
    }

    const service: Service<PhilipsHueServiceConfig, PhilipsHueServiceClient> = {
        schema: core.readSchema(__dirname, "../philipshue-schema.json"),
        serviceType: "philipshue",
        validateConfig,
        createClient: createClient(nodecg),
        stopClient,
    };

    return core.registerService(service);
};

async function validateConfig(config: PhilipsHueServiceConfig): Promise<Result<void>> {
    if (!config) {
        return error("No config found!");
    } else if (!config.discover && !config.ipAddr) {
        return error("discover isn't true there is no IP address!");
    }
    return emptySuccess();
}

function createClient(nodecg: NodeCG): (config: PhilipsHueServiceConfig) => Promise<Result<PhilipsHueServiceClient>> {
    return async (config) => {
        const { discover, ipAddr, port, username, apiKey } = config;
        let ip: string;
        if (discover) {
            const discIP = await discoverBridge();
            if (discIP) {
                ip = discIP;
            } else {
                return error("could not discover your Hue Bridge, maybe try specifying a specific IP!");
            }
        } else if (ipAddr && ipv4(ipAddr)) {
            // check if the IP address is there and is good
            ip = ipAddr;
        } else {
            // discover wasn't set to true and there is no IP address specified
            return error(
                "you did not set discover to true and there is no IP address specified!\n" +
                    "either try setting discover to true or specify a IP address",
            );
        }

        // check port number
        if (port && 0 <= port && port <= 65535) {
            ip += ":" + port;
        } else if (port) {
            return error("Your port is not between 0 and 65535!");
        }

        if (!username || apiKey) {
            // Create an unauthenticated instance of the Hue API so that we can create a new user
            const unauthenticatedApi = await api.createLocal(ip).connect();

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
        const client = await api.createLocal(ip, port).connect(config.username, config.apiKey);

        return success({
            getRawClient() {
                return client;
            },
        });
    };
}

function stopClient(_client: PhilipsHueServiceClient) {
    // Not supported from the client
}

async function discoverBridge() {
    const discoveryResults = await discovery.nupnpSearch();

    if (discoveryResults.length === 0) {
        console.error("Failed to resolve any Hue Bridges");
        return null;
    } else {
        // Ignoring that you could have more than one Hue Bridge on a network as this is unlikely in 99.9% of users situations
        return discoveryResults[0].ipaddress as string;
    }
}
