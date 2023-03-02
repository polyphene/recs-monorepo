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

export let ADMIN_ROLE = '';
export let REDEEMER_ROLE = '';
export let MINTER_ROLE = '';

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
const initRoles = async () => {
  if (ADMIN_ROLE || REDEEMER_ROLE || MINTER_ROLE) {
    throw new Error('calling initRoles function more than once');
  }

  const recMarketplace = getRecMarketplaceContractInstance();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
  ADMIN_ROLE = await recMarketplace.DEFAULT_ADMIN_ROLE();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
  MINTER_ROLE = await recMarketplace.MINTER_ROLE();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
  REDEEMER_ROLE = await recMarketplace.REDEEMER_ROLE();
};

initRoles().catch(() => console.log('failed to initialize role ids'));
