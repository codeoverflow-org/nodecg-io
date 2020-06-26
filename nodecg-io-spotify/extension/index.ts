import { NodeCG } from "nodecg/types/server";
import { NodeCGIOCore } from "nodecg-io-core/extension";
import { Service, ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
import SpotifyWebApi = require("spotify-web-api-node");
import open = require("open");
import { Router } from 'express';
import * as express from "express"

interface SpotifyServiceConfig {
    clientId: string,
    clientSecret: string,
    scopes: Array<string>
}

export interface SpotifyServiceClient {
    getRawClient(): SpotifyWebApi
}

module.exports = (nodecg: NodeCG): ServiceProvider<SpotifyServiceClient> | undefined => {
    nodecg.log.info("Spotify bundle started");
    const core: NodeCGIOCore | undefined = nodecg.extensions["nodecg-io-core"] as any;
    if (core === undefined) {
        nodecg.log.error("nodecg-io-core isn't loaded! Spotify bundle won't function without it.");
        return undefined;
    }

    const service: Service<SpotifyServiceConfig, SpotifyServiceClient> = {
        schema: core.readSchema(__dirname, "../spotify-schema.json"),
        serviceType: "spotify",
        validateConfig: validateConfig,
        createClient: createClient(nodecg),
        stopClient: stopClient
    };

    return core.registerService(service);
};

async function validateConfig(config: SpotifyServiceConfig): Promise<Result<void>> {
    if (config.clientId === "" || config.clientSecret === "" ||
        config.scopes === undefined || config.scopes.length === 0) {

        return error("not all required values have been set.");
    } else {
        return emptySuccess();
    }
}

function createClient(nodecg: NodeCG): (config: SpotifyServiceConfig) => Promise<Result<SpotifyServiceClient>> {
    return async (config) => {
        try {
            console.log("Spotify service connecting...");
            const callbackUrl = "http://localhost:9090/nodecg-io-spotify/spotifycallback"
            
            const spotifyApi = new SpotifyWebApi({
                clientId: config.clientId,
                clientSecret: config.clientSecret,
                redirectUri: callbackUrl
            });

            var promise = new Promise((resolve, reject) => {
                const router: Router = express.Router();

                router.get('/nodecg-io-spotify/spotifycallback', (req, res) => {
                    const authCode: string = req.query.code?.toString() || "";
                    spotifyApi.authorizationCodeGrant(authCode).then(
                        data => {
                            console.log("Spotify login successful!");
                            spotifyApi.setAccessToken(data.body['access_token']);
                            spotifyApi.setRefreshToken(data.body['refresh_token']);

                            setInterval(() => {
                                spotifyApi.refreshAccessToken().then(
                                    data => {
                                        console.log('The spotify access token has been refreshed!');

                                        // Save the access token so that it's used in future calls
                                        spotifyApi.setAccessToken(data.body['access_token']);
                                    },
                                    error => {
                                        console.log('Could not spotify refresh access token', error);
                                    }
                                )
                            }, 1800000)

                            resolve();
                        },
                        err => console.log('Spotify login error.', err)
                    );
                    res.send("<p>OK. This window may now be closed.</p>")
                });

                nodecg.mount(router);
            });

            const authorizeURL = spotifyApi.createAuthorizeURL(config.scopes, "defaultState");
            open(authorizeURL).then();

            await promise;
            nodecg.log.info("Successfully connected to the WebSocket server.");
            return success({
                getRawClient() {
                    return spotifyApi;
                }
            });
        } catch (err) {
            return error(err.toString());
        }
    };
}

function stopClient(client: SpotifyServiceClient): void {

}