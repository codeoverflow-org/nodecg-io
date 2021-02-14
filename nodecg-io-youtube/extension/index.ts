import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, error, ServiceBundle } from "nodecg-io-core";
import { google, youtube_v3 } from "googleapis";
import * as express from "express";
import opn = require("open");

interface YoutubeServiceConfig {
    clientID: string;
    clientSecret: string;
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
        const authUrl = auth.generateAuthUrl({
            access_type: "offline",
            scope: "https://www.googleapis.com/auth/youtube",
        });

        return new Promise((resolve, reject) => {
            const router: express.Router = express.Router();

            router.get("/nodecg-io-youtube/oauth2callback", async (req, res) => {
                try {
                    const params = req.query;
                    res.end("<script>window.close()</script>");
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const { tokens } = await auth.getToken(params.code!.toString());
                    auth.credentials = tokens;
                    const client = new youtube_v3.Youtube({ auth });
                    resolve(success(client));
                } catch (e) {
                    reject(error(e));
                }
            });

            this.nodecg.mount(router);
            opn(authUrl, { wait: false }).then((cp) => cp.unref());
        });
    }

    stopClient(_client: YoutubeServiceClient): void {
        // Cannot stop client
    }
}
