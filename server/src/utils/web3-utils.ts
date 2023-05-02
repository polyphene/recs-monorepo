import {
  getBatchFactoryAddressEnv,
  getEthHttpUriEnv,
  getEwfHttpUriEnv,
  getRecMarketplaceAddressEnv,
  getRegistryExtendedAddressEnv,
} from '../utils/env';
import { ethers } from 'ethers';
import recMarketplaceConfig from '../config/rec-marketplace';
import registryExtendedConfig from '../config/registry-extended';
import batchFactoryConfig from '../config/batch-factory';

export const getRecMarketplaceContractInstance = () => {
  const recMarketplaceAddress = getRecMarketplaceAddressEnv();
  const ethProvider = ethers.getDefaultProvider(getEthHttpUriEnv());

  return new ethers.Contract(
    recMarketplaceAddress,
    recMarketplaceConfig.abi,
    ethProvider,
  );
};

export const getEwfContractsInstances = () => {
  const registryExtendedAddress = getRegistryExtendedAddressEnv();
  const batchFactoryAddress = getBatchFactoryAddressEnv();
  const ewfProvider = ethers.getDefaultProvider(getEwfHttpUriEnv());

  return {
    registryExtendedContract: new ethers.Contract(
      registryExtendedAddress,
      registryExtendedConfig.abi,
      ewfProvider,
    ),
    batchFactoryContract: new ethers.Contract(
      batchFactoryAddress,
      batchFactoryConfig.abi,
      ewfProvider,
    ),
  };
};

export const getCurrentBlockHeight = () => {
  const ethProvider = ethers.getDefaultProvider(getEthHttpUriEnv());

  return ethProvider.getBlockNumber();
};

export let ADMIN_ROLE = '';
export let REDEEMER_ROLE = '';
export let MINTER_ROLE = '';
export let AUDITOR_ROLE = '';

export const getRoleJsonKey = (role: string) => {
  switch (role) {
    case ADMIN_ROLE:
      return 'isAdmin';
    case REDEEMER_ROLE:
      return 'isRedeemer';
    case MINTER_ROLE:
      return 'isMinter';
    default:
      throw Error('trying to get json key for unknown role');
  }
};

// Initialize roles ids based on contract
export const initRoles = async () => {
  if (ADMIN_ROLE || REDEEMER_ROLE || MINTER_ROLE || AUDITOR_ROLE) {
    throw new Error('calling initRoles function more than once');
  }

  const recMarketplace = getRecMarketplaceContractInstance();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
  ADMIN_ROLE = await recMarketplace.DEFAULT_ADMIN_ROLE();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
  MINTER_ROLE = await recMarketplace.MINTER_ROLE();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
  REDEEMER_ROLE = await recMarketplace.REDEEMER_ROLE();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
  AUDITOR_ROLE = await recMarketplace.AUDITOR_ROLE();
};
