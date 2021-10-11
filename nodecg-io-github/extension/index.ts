import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { Octokit } from "@octokit/rest";

export interface GitHubConfig {
    token: string;
}

export type GitHubClient = Octokit;

module.exports = (nodecg: NodeCG) => {
    new GitHubService(nodecg, "github", __dirname, "../schema.json").register();
};

class GitHubService extends ServiceBundle<GitHubConfig, GitHubClient> {
    async validateConfig(config: GitHubConfig): Promise<Result<void>> {
        const octokit = new Octokit({
            auth: config.token,
        });
        await octokit.repos.listForAuthenticatedUser({
            page: 0,
            per_page: 1,
        });
        return emptySuccess();
    }

    async createClient(config: GitHubConfig): Promise<Result<GitHubClient>> {
        const client = new Octokit({
            auth: config.token,
        });
        this.nodecg.log.info("Successfully created github client.");
        return success(client);
    }

    stopClient(_: GitHubClient): void {
        // Does not need to be stopped as it has no state or permanent connection.
    }
}
