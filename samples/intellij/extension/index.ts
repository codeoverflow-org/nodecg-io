import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { IntelliJServiceClient } from "nodecg-io-intellij/extension";
import * as intellij from "nodecg-io-intellij/extension/intellij";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for intellij started");

    // This explicit cast determines the client type in the requireService call
    const ij = (nodecg.extensions["nodecg-io-intellij"] as unknown) as
        | ServiceProvider<IntelliJServiceClient>
        | undefined;

    ij?.requireService(
        "intellij-sample",
        (intellij) => {
            nodecg.log.info("IntelliJ client has been updated. Printing all plugins.");

            intellij
                .getRawClient()
                .pluginManager.getPlugins(true)
                .then((plugins) => {
                    plugins.forEach((plugin: intellij.Plugin) => {
                        plugin
                            .getName()
                            .then((name) => {
                                nodecg.log.info(`Plugin ${name}`);
                            })
                            .catch((_) => {
                                nodecg.log.info(`Plugin ${plugin.id}`);
                            });
                    });
                })
                .catch((err) => {
                    nodecg.log.info(`Could not get plugins: ${String(err)}`);
                });
        },
        () => nodecg.log.info("IntelliJ client has been unset."),
    );
};
