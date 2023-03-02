import { getEthHttpUriEnv, getRecMarketplaceAddressEnv } from '../utils/env';
import { ethers, utils } from 'ethers';
import recMarketplaceConfig from '../config/rec-marketplace';

export const getRecMarketplaceContractInstance = () => {
  const recMarketplaceAddress = getRecMarketplaceAddressEnv();
  const ethProvider = ethers.getDefaultProvider(getEthHttpUriEnv());

  return new ethers.Contract(
    recMarketplaceAddress,
    recMarketplaceConfig.abi,
    ethProvider,
  );
};

export const TRANSFER_EVENT_ID = utils.id(
  'TransferSingle(address,address,address,uint256,uint256)',
);

export const LIST_EVENT_ID = utils.id(
  'TokenListed(address,uint256,uint256,uint256)',
);

export const BUY_EVENT_ID = utils.id(
  'TokenBought(address,address,uint256,uint256,uint256)',
);

export const REDEEM_EVENT_ID = utils.id('Redeem(address,uint256,uint256)');

export const GRANT_ROLE_EVENT_ID = utils.id(
  'RoleGranted(bytes32,address,address)',
);

export const REVOKE_ROLE_EVENT_ID = utils.id(
  'RoleRevoked(bytes32,address,address)',
);
