import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, Result } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { youtube_v3, google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
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
    async validateConfig(config: YoutubeServiceConfig): Promise<Result<void>> {
        return emptySuccess();
    }

    async createClient(config: YoutubeServiceConfig): Promise<Result<YoutubeServiceClient>> {
        const client = new youtube_v3.Youtube({});
        return success({
            getRawClient() {
                return client;
            },
        });
    }

    stopClient(_client: YoutubeServiceClient): void {}
}
/*

module.exports = (nodecg: NodeCG): ServiceProvider<YoutubeServiceClient> | undefined => {
    nodecg.log.info("Youtube bundle started");
    const core = (nodecg.extensions["nodecg-io-core"] as unknown) as NodeCGIOCore | undefined;
    if (core === undefined) {
        nodecg.log.error("nodecg-io-core isn't loaded! Youtube bundle won't function without it.");
        return undefined;
    }

    const service: Service<YoutubeServiceConfig, YoutubeServiceClient> = {
        schema: core.readSchema(__dirname, "../youtube-schema.json"),
        serviceType: "youtube",
        validateConfig: validateConfig,
        createClient: createClient(nodecg),
        stopClient: stopClient,
    };

    return core.registerService(service);
};

async function validateConfig(config: YoutubeServiceConfig): Promise<Result<void>> {
    try {
        // Try to connect to youtube
        // const auth = new google.auth.OAuth2(config.clientID, config.clientSecret);
        //
        // // const client = new google.youtube({ auth: "" });
        // const resp = await client.search.list("id,snippet", { q: "dogs", maxResults: 25 });
        // console.log(resp);
        return emptySuccess();
    } catch (err) {
        return error(err.toString());
    }
}

function createClient(nodecg: NodeCG): (config: YoutubeServiceConfig) => Promise<Result<YoutubeServiceClient>> {
    return async (config) => {
        try {
            nodecg.log.info("Connecting to youtube ...");
            const auth: OAuth2Client = new google.auth.OAuth2(
                config.clientID,
                config.clientSecret,
                "localhost:9090/nodecg-io-youtube/youtube",
            );
            // google.options({ auth });
            const client = new youtube_v3.Youtube({ auth });
            const promise = mountCallbackURL(nodecg, client);
            const authUrl = auth.generateAuthUrl({
                access_type: "offline",
                scope: "https://www.googleapis.com/auth/youtube",
            });
            opn(authUrl).then();
            const code = await promise;
            const { tokens } = await auth.getToken(code);
            auth.credentials = tokens;

            nodecg.log.info("Successfully connected to youtube!");

            return success({
                getRawClient() {
                    return client;
                },
            });
        } catch (err) {
            return error(err.toString());
        }
    };
}

function stopClient(_client: YoutubeServiceClient): void {
    // You are not really able to stop the client ...
}

function mountCallbackURL(nodecg: NodeCG, yt: youtube_v3.Youtube): Promise<string> {
    return new Promise((resolve, reject) => {
        const router: express.Router = express.Router();

        router.get("/nodecg-io-youtube/youtube", async (req, res) => {
            const authCode: string = req.query.code?.toString() || "";
            res.end("Close the window");
            resolve(authCode);
        });
        nodecg.mount(router);
    });
}
*/
