import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { Octokit } from "@octokit/rest";

export interface GithubConfig {
    token: string;
}

export type GithubClient = Octokit;

module.exports = (nodecg: NodeCG) => {
    new GithubService(nodecg, "github", __dirname, "../schema.json").register();
};

class GithubService extends ServiceBundle<GithubConfig, GithubClient> {
    async validateConfig(config: GithubConfig): Promise<Result<void>> {
        const octokit = new Octokit({
            auth: config.token,
        });
        await octokit.repos.listForAuthenticatedUser({
            page: 0,
            per_page: 1,
        });
        return emptySuccess();
    }

    async createClient(config: GithubConfig): Promise<Result<GithubClient>> {
        const client = new Octokit({
            auth: config.token,
        });
        this.nodecg.log.info("Successfully created github client.");
        return success(client);
    }

    stopClient(_: GithubClient): void {
        //
    }

    removeHandlers(_: GithubClient): void {
        //
    }
}
