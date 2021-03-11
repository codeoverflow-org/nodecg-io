import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, error, ServiceBundle } from "nodecg-io-core";
import { google, youtube_v3 } from "googleapis";
import type { Credentials } from "google-auth-library/build/src/auth/credentials";
import type { OAuth2Client } from "google-auth-library/build/src/auth/oauth2client";
import * as express from "express";
import opn = require("open");

interface YoutubeServiceConfig {
    clientID: string;
    clientSecret: string;
    refreshToken?: string;
}

export type YoutubeServiceClient = youtube_v3.Youtube;

module.exports = (nodecg: NodeCG) => {
    new YoutubeService(nodecg, "youtube", __dirname, "../youtube-schema.json").register();
};

class YoutubeService extends ServiceBundle<YoutubeServiceConfig, YoutubeServiceClient> {
    async validateConfig(_config: YoutubeServiceConfig): Promise<Result<void>> {
        return emptySuccess();
    }

    async createClient(config: YoutubeServiceConfig): Promise<Result<YoutubeServiceClient>> {
        const auth = new google.auth.OAuth2({
            clientId: config.clientID,
            clientSecret: config.clientSecret,
            redirectUri: "http://localhost:9090/nodecg-io-youtube/oauth2callback",
        });

        if (config.refreshToken) {
            this.nodecg.log.info("Re-using saved refresh token.");
            auth.setCredentials({
                refresh_token: config.refreshToken,
            });
        } else {
            this.nodecg.log.info("No refresh token found. Starting auth flow to get one...");
            auth.setCredentials(await this.initialAuth(auth));
            if (auth.credentials.refresh_token) {
                config.refreshToken = auth.credentials.refresh_token;
            }
        }

        // Save refresh tokens so they can be used next time to get a access token again
        auth.on("tokens", (tokens) => {
            if (tokens.refresh_token) {
                config.refreshToken = tokens.refresh_token;
            }
        });

        const client = new youtube_v3.Youtube({ auth });
        return success(client);
    }

    stopClient(_client: YoutubeServiceClient): void {
        // Cannot stop client
    }

    private initialAuth(auth: OAuth2Client): Promise<Credentials> {
        const authUrl = auth.generateAuthUrl({
            access_type: "offline",
            scope: "https://www.googleapis.com/auth/youtube",
            prompt: "consent",
        });

        return new Promise((resolve, reject) => {
            const router: express.Router = express.Router();

            router.get("/nodecg-io-youtube/oauth2callback", async (req, res) => {
                try {
                    const params = req.query;

                    const callbackWebsite =
                        "<html><head><script>window.close();</script></head><body>YouTube connection successful! You may close this window now.</body></html>";
                    res.send(callbackWebsite);

                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const { tokens } = await auth.getToken(params.code!.toString());
                    resolve(tokens);
                } catch (e) {
                    reject(error(e));
                }
            });

            this.nodecg.mount(router);
            opn(authUrl, { wait: false }).then((cp) => cp.unref());
        });
    }
}
