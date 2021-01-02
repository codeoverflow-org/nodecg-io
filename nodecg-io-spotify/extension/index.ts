import { NodeCG } from "nodecg/types/server";
import { ServiceClient } from "nodecg-io-core/extension/types";
import { emptySuccess, error, Result, success } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import * as express from "express";
import { Router } from "express";
import SpotifyWebApi = require("spotify-web-api-node");
import open = require("open");

interface SpotifyServiceConfig {
    clientId: string;
    clientSecret: string;
    scopes: Array<string>;
}

export class SpotifyServiceClient implements ServiceClient<SpotifyWebApi> {
    constructor(private client: SpotifyWebApi, private refreshInterval: NodeJS.Timeout) {}

    getNativeClient(): SpotifyWebApi {
        return this.client;
    }

    stopTokenRefreshing(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

let callbackUrl = "";
const callbackEndpoint = "/nodecg-io-spotify/spotifycallback";
const defaultState = "defaultState";
const refreshInterval = 1800000;

module.exports = (nodecg: NodeCG) => {
    callbackUrl = `http://${nodecg.config.baseURL}${callbackEndpoint}`;

    new SpotifyService(nodecg, "spotify", __dirname, "../spotify-schema.json").register();
};

class SpotifyService extends ServiceBundle<SpotifyServiceConfig, SpotifyServiceClient> {
    async validateConfig(config: SpotifyServiceConfig): Promise<Result<void>> {
        if (config.scopes === undefined || config.scopes.length === 0) {
            return error("Scopes are empty. Please specify at least one scope.");
        } else {
            return emptySuccess();
        }
    }

    async createClient(config: SpotifyServiceConfig): Promise<Result<SpotifyServiceClient>> {
        this.nodecg.log.info("Spotify service connecting...");

        const spotifyApi = new SpotifyWebApi({
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            redirectUri: callbackUrl,
        });

        // Creates a callback entry point using express. The promise resolves when this url is called.
        const promise = this.mountCallBackURL(spotifyApi);

        // Create and call authorization URL
        const authorizeURL = spotifyApi.createAuthorizeURL(config.scopes, defaultState);
        await open(authorizeURL);

        await promise;
        this.nodecg.log.info("Successfully connected to Spotify!");

        return success(new SpotifyServiceClient(spotifyApi, this.startTokenRefreshing(spotifyApi)));
    }

    private mountCallBackURL(spotifyApi: SpotifyWebApi) {
        return new Promise((resolve) => {
            const router: Router = express.Router();

            router.get(callbackEndpoint, (req, res) => {
                // Get auth code with is returned as url query parameter if everything was successful
                const authCode: string = req.query.code?.toString() ?? "";

                spotifyApi?.authorizationCodeGrant(authCode).then(
                    (data) => {
                        spotifyApi.setAccessToken(data.body["access_token"]);
                        spotifyApi.setRefreshToken(data.body["refresh_token"]);

                        resolve(undefined);
                    },
                    (err) => this.nodecg.log.error("Spotify login error.", err),
                );

                // This little snippet closes the oauth window after the connection was successful
                const callbackWebsite =
                    "<http><head><script>window.close();</script></head><body>Spotify connection successful! You may close this window now.</body></http>";
                res.send(callbackWebsite);
            });

            this.nodecg.mount(router);
        });
    }

    private startTokenRefreshing(spotifyApi: SpotifyWebApi): NodeJS.Timeout {
        return setInterval(() => {
            spotifyApi.refreshAccessToken().then(
                (data) => {
                    this.nodecg.log.info("The spotify access token has been refreshed!");

                    // Save the access token so that it's used in future calls
                    spotifyApi.setAccessToken(data.body["access_token"]);
                },
                (error) => {
                    this.nodecg.log.warn("Could not spotify refresh access token", error);
                },
            );
        }, refreshInterval);
    }

    stopClient(client: SpotifyServiceClient): void {
        // Client can't be stopped, it is just a stateless http client but token refreshing should be stopped
        client.stopTokenRefreshing();
    }
}
