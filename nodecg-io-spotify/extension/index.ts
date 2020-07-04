import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import SpotifyWebApi = require("spotify-web-api-node");
import open = require("open");
import { Router } from "express";
import * as express from "express";

interface SpotifyServiceConfig {
    clientId: string;
    clientSecret: string;
    scopes: Array<string>;
}

export interface SpotifyServiceClient {
    getRawClient(): SpotifyWebApi;
}

let callbackUrl = "";
const callbackEndpoint = "/nodecg-io-spotify/spotifycallback";
const defaultState = "defaultState";
const refreshInterval = 1800000;

module.exports = (nodecg: NodeCG): ServiceProvider<SpotifyServiceClient> | undefined => {
    callbackUrl = `http://${nodecg.config.baseURL}${callbackEndpoint}`;

    const spotifyService = new SpotifyService(nodecg, "spotify", __dirname, "../spotify-schema.json");
    return spotifyService.register();
};

class SpotifyService extends ServiceBundle {
    async validateConfig(config: SpotifyServiceConfig): Promise<Result<void>> {
        if (config.scopes === undefined || config.scopes.length === 0) {
            return error("Scopes are empty. Please specify at least one scope.");
        } else {
            return emptySuccess();
        }
    }

    createClient(nodecg: NodeCG): (config: SpotifyServiceConfig) => Promise<Result<SpotifyServiceClient>> {
        return async (config) => {
            nodecg.log.info("Spotify service connecting...");

            const spotifyApi = new SpotifyWebApi({
                clientId: config.clientId,
                clientSecret: config.clientSecret,
                redirectUri: callbackUrl,
            });

            // Creates a callback entry point using express. The promise resolves when this url is called.
            const promise = this.mountCallBackURL(nodecg, spotifyApi);

            // Create and call authorization URL
            const authorizeURL = spotifyApi.createAuthorizeURL(config.scopes, defaultState);
            open(authorizeURL).then();

            await promise;
            nodecg.log.info("Successfully connected to Spotify!");

            return success({
                getRawClient() {
                    return spotifyApi;
                },
            });
        };
    }

    mountCallBackURL(nodecg: NodeCG, spotifyApi: SpotifyWebApi) {
        return new Promise((resolve) => {
            const router: Router = express.Router();

            router.get(callbackEndpoint, (req, res) => {
                // Get auth code with is returned as url query parameter if everything was successful
                const authCode: string = req.query.code?.toString() || "";

                spotifyApi?.authorizationCodeGrant(authCode).then(
                    (data) => {
                        spotifyApi.setAccessToken(data.body["access_token"]);
                        spotifyApi.setRefreshToken(data.body["refresh_token"]);

                        this.startTokenRefreshing(nodecg, spotifyApi);

                        resolve();
                    },
                    (err) => nodecg.log.error("Spotify login error.", err),
                );

                // This little snippet closes the oauth window after the connection was successful
                const callbackWebsite =
                    "<http><head><script>window.close();</script></head><body>Spotify connection successful! You may close this window now.</body></http>";
                res.send(callbackWebsite);
            });

            nodecg.mount(router);
        });
    }

    startTokenRefreshing(nodecg: NodeCG, spotifyApi: SpotifyWebApi) {
        setInterval(() => {
            spotifyApi.refreshAccessToken().then(
                (data) => {
                    nodecg.log.info("The spotify access token has been refreshed!");

                    // Save the access token so that it's used in future calls
                    spotifyApi.setAccessToken(data.body["access_token"]);
                },
                (error) => {
                    nodecg.log.warn("Could not spotify refresh access token", error);
                },
            );
        }, refreshInterval);
    }

    stopClient(_client: SpotifyServiceClient): void {
        // Not supported from the client
    }
}
