import { GithubManager } from './github';
import type { GitManager, GitManagerConfig } from './types';

const supportedProviders = {
  github: (config: GitManagerConfig): GitManager =>
    new GithubManager(config as any) as unknown as GitManager,
};

export const createDriver = (
  provider: keyof typeof supportedProviders,
  config: GitManagerConfig
): GitManager => {
  const factory = supportedProviders[provider];
  if (!factory) {
    throw new Error(
      `Provider "${provider}" not supported. Supported providers: ${Object.keys(supportedProviders).join(', ')}`
    );
  }
  return factory(config);
};
