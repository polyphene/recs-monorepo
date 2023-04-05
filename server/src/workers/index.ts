import { getEthWssUriEnv, getRecMarketplaceAddressEnv } from '../utils/env';
import recMarketplace from '../config/rec-marketplace';
import { constants } from 'ethers';
import { Contract, BigNumber } from 'ethers';
import { handleMint, handleRedeem, handleTransfer } from './handle-rec';
import { handleBuy, handleList } from './handle-marketplace';
import { handleGrantRole, handleRevokeRole } from './handle-roles';
import { WebSocketProvider } from '../utils/web3-socket-provider';

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
    contract.filters.TransferSingle(),
    (
      operator: string,
      from: string,
      to: string,
      id: BigNumber,
      value: BigNumber,
    ) => {
      // Check if mint
      if (from === constants.AddressZero) {
        handleMint(operator, from, to, id, value).catch(e => {
          console.log(e);
          console.log(
            `could not handle mint event for tokenId: ${id.toString()}`,
          );
        });
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
    contract.filters.TokenListed(),
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
    contract.filters.TokenBought(),
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
    contract.filters.Redeem(),
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
    contract.filters.RoleGranted(),
    (role: string, account: string, sender: string) => {
      handleGrantRole(role, account, sender).catch(() =>
        console.log(
          `could not handle grant role ${role} event for address: ${account}`,
        ),
      );
      return;
    },
  );

  // Handle revoke role event
  contract.on(
    contract.filters.RoleRevoked(),
    (role: string, account: string, sender: string) => {
      handleRevokeRole(role, account, sender).catch(e => {
        console.log(e);
        console.log(
          `could not handle revoke role ${role} event for address: ${account}`,
        );
      });
      return;
    },
  );
};
