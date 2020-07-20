import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, Result } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { youtube_v3, google } from "googleapis";
import * as express from "express";
import opn = require("open");

interface YoutubeServiceConfig {
    clientID: string;
    clientSecret: string;
}

export interface YoutubeServiceClient {
    getRawClient(): youtube_v3.Youtube;
}

module.exports = (nodecg: NodeCG): ServiceProvider<YoutubeServiceClient> | undefined => {
    const youtubeService = new YoutubeService(nodecg, "youtube", __dirname, "../youtube-schema.json");
    return youtubeService.register();
};

class YoutubeService extends ServiceBundle<YoutubeServiceConfig, YoutubeServiceClient> {
    async validateConfig(_config: YoutubeServiceConfig): Promise<Result<void>> {
        return emptySuccess();
    }

    async createClient(config: YoutubeServiceConfig): Promise<Result<YoutubeServiceClient>> {
        // https://developers.google.com/identity/protocols/oauth2/web-server#creatingcred
        const auth = new google.auth.OAuth2({
            clientId: config.clientID,
            clientSecret: config.clientSecret,
            redirectUri: "localhost:9090/nodecg-io-youtube/oauth2callback",
        });
        const authUrl = auth.generateAuthUrl({
            access_type: "offline",
            scope: "https://www.googleapis.com/auth/youtube",
        });

        return new Promise((resolve, reject) => {
            const router: express.Router = express.Router();

            router.get("/nodecg-io-youtube/oauth2callback", async (req, res) => {
                try {
                    const params = req.query;
                    res.end("Auth successful! Return to console!");
                    const { tokens } = await auth.getToken(params.code!.toString());
                    auth.credentials = tokens;
                    const client = new youtube_v3.Youtube({ auth });
                    resolve(
                        success({
                            getRawClient() {
                                return client;
                            },
                        }),
                    );
                } catch (e) {
                    reject(e);
                }
            });

            this.nodecg.mount(router);
            opn(authUrl, { wait: false }).then((cp) => cp.unref());
        });
    }

    stopClient(_client: YoutubeServiceClient): void {}
}
