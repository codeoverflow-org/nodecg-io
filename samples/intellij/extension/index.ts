import { NodeCG } from "nodecg-types/types/server";
import { IntelliJServiceClient } from "nodecg-io-intellij";
import { Plugin } from "nodecg-io-intellij/extension/intellij";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for intellij started");

    const ij = requireService<IntelliJServiceClient>(nodecg, "intellij");

    ij?.onAvailable((intellij) => {
        nodecg.log.info("IntelliJ client has been updated, printing all plugins.");

        intellij.pluginManager
            .getPlugins(true)
            .then((plugins) => {
                plugins.forEach((plugin: Plugin) => {
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
    });

    ij?.onUnavailable(() => nodecg.log.info("IntelliJ client has been unset."));
};
