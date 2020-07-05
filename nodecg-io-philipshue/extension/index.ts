import { NodeCG } from "nodecg/types/server";
import { NodeCGIOCore } from "nodecg-io-core/extension";
import { Service, ServiceProvider } from "nodecg-io-core/extension/types";
import { Result, emptySuccess, error, success } from "nodecg-io-core/extension/utils/result";
import { v4 as ipv4 } from "is-ip";
import { v3 } from "node-hue-api";
import Api = require("node-hue-api/lib/api/Api");
const { api, discovery } = v3;

const appName = "nodecg-io";
const deviceName = "nodecg-io-philipshue";

interface PhilipsHueServiceConfig {
    discover: boolean;
    ipAddr?: string;
    port?: number;
}

export interface PhilipsHueServiceClient {
    getRawClient(): Api;
}

export function PhilipsHue(nodecg: NodeCG): ServiceProvider<PhilipsHueServiceClient> | undefined {
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
}

async function validateConfig(config: PhilipsHueServiceConfig): Promise<Result<void>> {
    if (!config) {
        return error("No config found!");
    } else {
        return emptySuccess();
    }
}

function createClient(nodecg: NodeCG): (config: PhilipsHueServiceConfig) => Promise<Result<PhilipsHueServiceClient>> {
    return async (config) => {
        const { discover, ipAddr, port } = config;
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

        // Create an unauthenticated instance of the Hue API so that we can create a new user
        const unauthenticatedApi = await api.createLocal(ip).connect();

        let createdUser;
        try {
            createdUser = await unauthenticatedApi.users.createUser(appName, deviceName);
            // debug output
            // nodecg.log.info("*******************************************************************************\n");
            // nodecg.log.info(
            //     "User has been created on the Hue Bridge. The following username can be used to\n" +
            //         "authenticate with the Bridge and provide full local access to the Hue Bridge.\n" +
            //         "YOU SHOULD TREAT THIS LIKE A PASSWORD\n",
            // );
            // nodecg.log.info(`Hue Bridge User: ${createdUser.username}`);
            // nodecg.log.info(`Hue Bridge User Client Key: ${createdUser.clientkey}`);
            // nodecg.log.info("*******************************************************************************\n");

            // Create a new API instance that is authenticated with the new user we created
            const client = await api.createLocal(ip, port).connect(createdUser.username);

            return success({
                getRawClient() {
                    return client;
                },
            });
        } catch (err) {
            if (err.getHueErrorType() === 101) {
                return error(
                    "The Link button on the bridge was not pressed. Please press the Link button and try again.",
                );
            } else {
                return error(`Unexpected Error: ${err.message}`);
            }
        }
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
