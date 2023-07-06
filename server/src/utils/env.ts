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

export const getDeploymentBlockHeightEnv = (): string => {
    const env = process.env.DEPLOYMENT_BLOCK_HEIGHT;
    if (env === undefined) {
        throw new Error('DEPLOYMENT_BLOCK_HEIGHT environment variable is not set');
    }

    return env;
};

export const getWeb3StorageKeyEnv = (): string => {
    const env = process.env.WEB3_STORAGE_KEY;
    if (env === undefined) {
        throw new Error('WEB3_STORAGE_KEY environment variable is not set');
    }

    return env;
};

/*
 * Energy Wef Foundation related env
 */
export const getEwfHttpUriEnv = (): string => {
    const env = process.env.EWF_HTTP_URI;
    if (env === undefined) {
        throw new Error('EWF_HTTP_URI environment variable is not set');
    }

    return env;
};

export const getRegistryExtendedAddressEnv = (): string => {
    const env = process.env.REGISTRY_EXTENDED_ADDRESS;
    if (env === undefined) {
        throw new Error('REGISTRY_EXTENDED_ADDRESS environment variable is not set');
    }

    return env;
};

export const getBatchFactoryAddressEnv = (): string => {
    const env = process.env.BATCH_FACTORY_ADDRESS;
    if (env === undefined) {
        throw new Error('BATCH_FACTORY_ADDRESS environment variable is not set');
    }

    return env;
};

export const getAgreementFactoryAddressEnv = (): string => {
    const env = process.env.AGREEMENT_FACTORY_ADDRESS;
    if (env === undefined) {
        throw new Error('AGREEMENT_FACTORY_ADDRESS environment variable is not set');
    }

    return env;
};

/*
 * Bridge related environments
 */
export const getBridgePrivateKeyEnv = (): string => {
    const env = process.env.BRIDGE_PRIVATE_KEY;
    if (env === undefined) {
        throw new Error('BRIDGE_PRIVATE_KEY environment variable is not set');
    }

    return env;
};

export const loadEnv = (): void => {
    getPortEnv();
    getRecMarketplaceAddressEnv();
    getEthWssUriEnv();
    getEthHttpUriEnv();
    getDeploymentBlockHeightEnv();
    getWeb3StorageKeyEnv();
    getEwfHttpUriEnv();
    getRegistryExtendedAddressEnv();
    getBatchFactoryAddressEnv();
    getAgreementFactoryAddressEnv();
    getBridgePrivateKeyEnv();
};
