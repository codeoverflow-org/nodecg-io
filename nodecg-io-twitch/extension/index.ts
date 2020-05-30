import { NodeCG } from 'nodecg/types/server'
import { NodeCGIOCore } from 'nodecg-io-core/extension'
import { Service, ServiceProvider } from 'nodecg-io-core/extension/types'
import {emptySuccess, success} from "nodecg-io-core/extension/utils/result";

interface TwitchConfig {
	oauthKey: string
}

export interface TwitchClient {
	testString?: string
}

module.exports = (nodecg: NodeCG): ServiceProvider<TwitchClient> | undefined => {
	nodecg.log.info("Twitch bundle started");
	const core: NodeCGIOCore = nodecg.extensions['nodecg-io-core'] as any;
	if (core === undefined) {
		nodecg.log.error("nodecg-io-core isn't loaded! Twitch bundle won't function without it.");
		return undefined;
	}

	const service: Service<TwitchConfig, TwitchClient> = {
		// schemaPath: path.resolve(__dirname, "../twitch-schema.json"), // TODO: fix schemas
		serviceType: "twitch",
		validateConfig: (config: TwitchConfig) => {
			nodecg.log.info("Validating twitch config:");
			nodecg.log.info(JSON.stringify(config));
			return emptySuccess();
		},
		createClient: (config: TwitchConfig) => {
			nodecg.log.info("Creating twitch client of this config:");
			nodecg.log.info(JSON.stringify(config));
			return success({
				testString: config ? config.oauthKey : undefined
			});
		}
	};

	core.serviceManager.registerService(service);
	return core.bundleManager.createServiceProvider(service);
};
