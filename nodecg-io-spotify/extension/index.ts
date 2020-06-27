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

var callbackUrl = "";
var callbackEndpoint = "/nodecg-io-spotify/spotifycallback";
const defaultState = "defaultState";
const refreshInterval = 1800000;

module.exports = (nodecg: NodeCG): ServiceProvider<SpotifyServiceClient> | undefined => {
    nodecg.log.info("Spotify bundle started.");
    const core: NodeCGIOCore | undefined = nodecg.extensions["nodecg-io-core"] as any;
    if (core === undefined) {
        nodecg.log.error("nodecg-io-core isn't loaded! Spotify bundle won't function without it.");
        return undefined;
    }

    callbackUrl = `http://${nodecg.config.baseURL}${callbackEndpoint}`;

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
    if (config.scopes === undefined || config.scopes.length === 0) {

        return error("Scopes are empty. Please specify at least one scope.");
    } else {
        return emptySuccess();
    }
}

function createClient(nodecg: NodeCG): (config: SpotifyServiceConfig) => Promise<Result<SpotifyServiceClient>> {
    return async (config) => {
        try {
            console.log("Spotify service connecting...");

            const spotifyApi = new SpotifyWebApi({
                clientId: config.clientId,
                clientSecret: config.clientSecret,
                redirectUri: callbackUrl
            });

            // Creates a callback entry point using express. The promise resolves when this url is called.
            const promise = mountCallBackURL(nodecg, spotifyApi);

            // Create and call authorization URL
            const authorizeURL = spotifyApi.createAuthorizeURL(config.scopes, defaultState);
            open(authorizeURL).then();

            await promise;
            nodecg.log.info("Successfully connected to Spotify!");

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

function mountCallBackURL(nodecg: NodeCG, spotifyApi: SpotifyWebApi) {
    return new Promise((resolve, reject) => {
        const router: Router = express.Router();

        router.get(callbackEndpoint, (req, res) => {

            // Get auth code with is returned as url query parameter if everything was successful
            const authCode: string = req.query.code?.toString() || "";

            spotifyApi?.authorizationCodeGrant(authCode).then(
                data => {
                    spotifyApi.setAccessToken(data.body['access_token']);
                    spotifyApi.setRefreshToken(data.body['refresh_token']);

                    startTokenRefreshing(nodecg, spotifyApi);

                    resolve();
                },
                err => nodecg.log.error('Spotify login error.', err)
            );

            // This little snippet closes the oauth window after the connection was successful
            const callbackWebsite = "<http><head><script>window.close();</script></head><body>Spotify connection successful! You may close this window now.</body></http>";
            res.send(callbackWebsite)
        });

        nodecg.mount(router);
    });
}

function startTokenRefreshing(nodecg: NodeCG, spotifyApi: SpotifyWebApi) {
    setInterval(() => {
        spotifyApi.refreshAccessToken().then(
            data => {
                nodecg.log.info('The spotify access token has been refreshed!');

                // Save the access token so that it's used in future calls
                spotifyApi.setAccessToken(data.body['access_token']);
            },
            error => {
                nodecg.log.warn('Could not spotify refresh access token', error);
            }
        )
    }, refreshInterval)
}

function stopClient(client: SpotifyServiceClient): void {
    // Not supported from the client
}