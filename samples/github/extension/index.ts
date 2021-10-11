import { NodeCG } from "nodecg-types/types/server";
import { GithubClient } from "nodecg-io-github";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for Github started.");

    const github = requireService<GithubClient>(nodecg, "github");

    github?.onAvailable(async (github) => {
        nodecg.log.info("Github service available.");
        nodecg.log.info(
            "GitHub repositories: " +
                (
                    await github.repos.listForAuthenticatedUser({
                        page: 0,
                        per_page: 100,
                        type: "all",
                    })
                ).data.map((repo) => repo.name),
        );
    });

    github?.onUnavailable(() => {
        nodecg.log.info("Github service unavailable.");
    });
};
