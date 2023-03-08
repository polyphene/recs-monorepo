export const getPortEnv = (): string => {
  const env = process.env.PORT;
  if (env === undefined) {
    throw new Error('PORT environment variable is not set');
  }

  return env;
};

export const getRecMarketplaceAddressEnv = (): string => {
  const env = process.env.REC_MARKETPLACE_ADDRESS;
  if (env === undefined) {
    throw new Error('REC_MARKETPLACE_ADDRESS environment variable is not set');
  }

  return env;
};

export const getEthWssUriEnv = (): string => {
  const env = process.env.ETH_WSS_URI;
  if (env === undefined) {
    throw new Error('ETH_WSS_URI environment variable is not set');
  }

  return env;
};

export const getEthHttpUriEnv = (): string => {
  const env = process.env.ETH_HTTP_URI;
  if (env === undefined) {
    throw new Error('ETH_HTTP_URI environment variable is not set');
  }

  return env;
};

export const getDeploymentBlockHeight = (): string => {
  const env = process.env.DEPLOYMENT_BLOCK_HEIGHT;
  if (env === undefined) {
    throw new Error('DEPLOYMENT_BLOCK_HEIGHT environment variable is not set');
  }

  return env;
};

export const loadEnv = (): void => {
  getPortEnv();
  getRecMarketplaceAddressEnv();
  getEthWssUriEnv();
  getEthHttpUriEnv();
  getDeploymentBlockHeight();
};
