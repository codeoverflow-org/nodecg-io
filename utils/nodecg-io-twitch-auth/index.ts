import { AuthProvider, getTokenInfo as twitchGetTokenInfo, StaticAuthProvider, TokenInfo } from "@twurple/auth";

export interface TwitchServiceConfig {
    oauthKey: string;
}

export async function createAuthProvider(cfg: TwitchServiceConfig): Promise<AuthProvider> {
    const tokenInfo = await getTokenInfo(cfg);
    return new StaticAuthProvider(tokenInfo.clientId, normalizeToken(cfg), tokenInfo.scopes);
}

/**
 * Gets the token info for the passed config.
 */
export async function getTokenInfo(cfg: TwitchServiceConfig): Promise<TokenInfo> {
    return twitchGetTokenInfo(normalizeToken(cfg));
}

/**
 * Strips any "oauth:" before the token away, because the client needs the token without it.
 */
export function normalizeToken(cfg: TwitchServiceConfig): string {
    return cfg.oauthKey.replace("oauth:", "");
}
