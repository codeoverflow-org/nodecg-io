import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, error, ServiceBundle, Logger } from "nodecg-io-core";
import { google, GoogleApis } from "googleapis";
import type { Credentials } from "google-auth-library/build/src/auth/credentials";
import type { OAuth2Client } from "google-auth-library/build/src/auth/oauth2client";
import opn = require("open");

interface GoogleApisServiceConfig {
    clientID: string;
    clientSecret: string;
    refreshToken?: string;
    scopes?: string | string[];
}

export type GoogleApisServiceClient = GoogleApis;

module.exports = (nodecg: NodeCG) => {
    new GoogleApisService(nodecg, "googleapis", __dirname, "../googleapis-schema.json").register();
};

class GoogleApisService extends ServiceBundle<GoogleApisServiceConfig, GoogleApisServiceClient> {
    async validateConfig(_config: GoogleApisServiceConfig): Promise<Result<void>> {
        return emptySuccess();
    }

    async createClient(config: GoogleApisServiceConfig, logger: Logger): Promise<Result<GoogleApisServiceClient>> {
        const auth = new google.auth.OAuth2({
            clientId: config.clientID,
            clientSecret: config.clientSecret,
            redirectUri: "http://localhost:9090/nodecg-io-googleapis/oauth2callback",
        });

        await this.refreshTokens(config, auth, logger);

        const client = new GoogleApis({ auth });
        return success(client);
    }

    stopClient(_client: GoogleApisServiceClient): void {
        return;
    }

    private async initialAuth(config: GoogleApisServiceConfig, auth: OAuth2Client): Promise<Credentials> {
        const authURL = auth.generateAuthUrl({
            access_type: "offline",
            prompt: "consent",
            scope: config.scopes,
        });

        return new Promise((resolve, reject) => {
            const router = this.nodecg.Router();

            router.get("/nodecg-io-googleapis/oauth2callback", async (req, res) => {
                try {
                    const response = `<html><head><script>window.close();</script></head><body>Google Api connection successful! You may close this window now.</body></html>`;
                    res.send(response);

                    const { tokens } = await auth.getToken(req.query.code as string);
                    resolve(tokens);
                } catch (e) {
                    reject(error(e));
                }
            });

            this.nodecg.mount(router);
            opn(authURL, { wait: false }).then((cp) => cp.unref());
        });
    }

    private async refreshTokens(config: GoogleApisServiceConfig, auth: OAuth2Client, logger: Logger) {
        if (config.refreshToken) {
            logger.info("Re-using saved refresh token.");
            auth.setCredentials({ refresh_token: config.refreshToken });
        } else {
            logger.info("No refresh token found. Starting auth flow to get one ...");
            auth.setCredentials(await this.initialAuth(config, auth));
            if (auth.credentials.refresh_token) {
                config.refreshToken = auth.credentials.refresh_token;
            }
        }

        auth.on("tokens", (tokens) => {
            if (tokens.refresh_token) config.refreshToken = tokens.refresh_token;
        });
    }
}
