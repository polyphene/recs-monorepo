import { getEthWssUriEnv, getRecMarketplaceAddressEnv } from '../utils/env';
import recMarketplace from '../config/rec-marketplace';
import { constants } from 'ethers';
import { Contract, utils, BigNumber } from 'ethers';
import {
  BUY_EVENT_ID,
  GRANT_ROLE_EVENT_ID,
  LIST_EVENT_ID,
  REDEEM_EVENT_ID,
  REVOKE_ROLE_EVENT_ID,
  TRANSFER_EVENT_ID,
} from '../utils/web3-utils';
import { WebSocketProvider } from '../utils/web3-socket-provider';
import { handleMint, handleRedeem, handleTransfer } from './handle-rec';
import { handleBuy, handleList } from './handle-marketplace';
import { handleGrantRole, handleRevokeRole } from './handle-roles';

export const startWorkers = () => {
  const recMarketplaceAddress = getRecMarketplaceAddressEnv();
  const provider = new WebSocketProvider(getEthWssUriEnv());

  const contract = new Contract(
    recMarketplaceAddress,
    recMarketplace.abi,
    provider,
  );

  // Handle minting and transfer events
  contract.on(
    {
      topics: [utils.id(TRANSFER_EVENT_ID)],
    },
    (
      operator: string,
      from: string,
      to: string,
      id: BigNumber,
      value: BigNumber,
    ) => {
      // Check if mint
      if (from === constants.AddressZero) {
        handleMint(operator, from, to, id, value).catch(() =>
          console.log(
            `could not handle mint event for tokenId: ${id.toString()}`,
          ),
        );
        return;
      }
      handleTransfer(operator, from, to, id, value).catch(() =>
        console.log(
          `could not handle transfer event for tokenId: ${id.toString()}`,
        ),
      );
      return;
    },
  );

  // Handle list event
  contract.on(
    {
      topics: [utils.id(LIST_EVENT_ID)],
    },
    (
      seller: string,
      tokenId: BigNumber,
      tokenAmount: BigNumber,
      price: BigNumber,
    ) => {
      handleList(seller, tokenId, tokenAmount, price).catch(() =>
        console.log(
          `could not handle list event for tokenId: ${tokenId.toString()}`,
        ),
      );
      return;
    },
  );

  // Handle buy event
  contract.on(
    {
      topics: [utils.id(BUY_EVENT_ID)],
    },
    (
      buyer: string,
      seller: string,
      tokenId: BigNumber,
      tokenAmount: BigNumber,
      price: BigNumber,
    ) => {
      handleBuy(buyer, seller, tokenId, tokenAmount, price).catch(() =>
        console.log(
          `could not handle buy event for tokenId: ${tokenId.toString()}`,
        ),
      );
      return;
    },
  );

  // Handle redeem event
  contract.on(
    {
      topics: [utils.id(REDEEM_EVENT_ID)],
    },
    (owner: string, tokenId: BigNumber, amount: BigNumber) => {
      handleRedeem(owner, tokenId, amount).catch(() =>
        console.log(
          `could not handle redeem event for tokenId: ${tokenId.toString()}`,
        ),
      );
      return;
    },
  );

  // Handle grant role event
  contract.on(
    {
      topics: [utils.id(GRANT_ROLE_EVENT_ID)],
    },
    (role: string, account: string) => {
      handleGrantRole(role, account).catch(() =>
        console.log(
          `could not handle grant role ${role} event for address: ${account}`,
        ),
      );
      return;
    },
  );

  // Handle revoke role event
  contract.on(
    {
      topics: [utils.id(REVOKE_ROLE_EVENT_ID)],
    },
    (role: string, account: string) => {
      handleRevokeRole(role, account).catch(() =>
        console.log(
          `could not handle revoke role ${role} event for address: ${account}`,
        ),
      );
      return;
    },
  );
};
