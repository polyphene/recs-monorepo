import { BigNumber } from 'ethers';
import {
  getCurrentBlockHeight,
  getRecMarketplaceContractInstance,
} from '../utils/web3-utils';
import { EventType, PrismaClient } from '@prisma/client';

export const handleMint = async (
  operator: string,
  from: string,
  to: string,
  id: BigNumber,
  value: BigNumber,
) => {
  // Get event metadata
  const blockHeight = await getCurrentBlockHeight();
  const recMarketplace = getRecMarketplaceContractInstance();

  // Fetch TransferSingle events from the chain, we will only handle one of them as it is most likely the one
  // we are looking for
  const tokenMinted = await recMarketplace.queryFilter(
    recMarketplace.filters.TransferSingle(operator, from, to),
    blockHeight,
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
  const uri: string = await recMarketplace.uri(id);

  const prisma = new PrismaClient();

  // Update minted status of metadata
  // TODO would be ideal to do upsert here in case someone is not using our app to mint (low probability)
  await prisma.metadata
    .update({
      where: {
        cid: uri,
      },
      data: {
        minted: true,
      },
    })
    .catch(() => {
      console.log(`could not update metadata.minted to true for cid: ${uri}`);
    });

  const mintData = {
    tokenId: id.toString(),
    // Disabling eslint rule which poses problem at assignment (prisma issue here)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    eventType: EventType.MINT,
    data: {
      operator,
      from,
      to,
      id: id.toString(),
      value: value.toString(),
    },
    blockHeight: blockHeight.toString(),
    transactionHash: tokenMinted[0].transactionHash,
    logIndex: tokenMinted[0].logIndex,
  };
  // Upsert ensures that we are only having one event record per event
  await prisma.event
    .upsert({
      where: {
        blockHeight_transactionHash_logIndex: {
          blockHeight: blockHeight.toString(),
          transactionHash: tokenMinted[0].transactionHash,
          logIndex: tokenMinted[0].logIndex,
        },
      },
      update: mintData,
      create: mintData,
    })
    .catch(() => {
      console.log(`could not create MINT event for token: ${id.toString()}`);
    });
};

export const handleTransfer = async (
  operator: string,
  from: string,
  to: string,
  id: BigNumber,
  value: BigNumber,
) => {
  // Get event metadata
  const blockHeight = await getCurrentBlockHeight();
  const recMarketplace = getRecMarketplaceContractInstance();

  // Fetch TransferSingle events from the chain, we will only handle one of them as it is most likely the one
  // we are looking for
  const tokenTransfered = await recMarketplace.queryFilter(
    recMarketplace.filters.TransferSingle(operator, from, to),
    blockHeight,
  );

  const prisma = new PrismaClient();

  const transferData = {
    tokenId: id.toString(),
    // Disabling eslint rule which poses problem at assignment (prisma issue here)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    eventType: EventType.TRANSFER,
    data: {
      operator,
      from,
      to,
      id: id.toString(),
      value: value.toString(),
    },
    blockHeight: blockHeight.toString(),
    transactionHash: tokenTransfered[0].transactionHash,
    logIndex: tokenTransfered[0].logIndex,
  };
  await prisma.event
    .upsert({
      where: {
        blockHeight_transactionHash_logIndex: {
          blockHeight: blockHeight.toString(),
          transactionHash: tokenTransfered[0].transactionHash,
          logIndex: tokenTransfered[0].logIndex,
        },
      },
      update: transferData,
      create: transferData,
    })
    .catch(() => {
      console.log(
        `could not create TRANSFER event for token: ${id.toString()}`,
      );
    });
};

export const handleRedeem = async (
  owner: string,
  tokenId: BigNumber,
  amount: BigNumber,
) => {
  // Get event metadata
  const blockHeight = await getCurrentBlockHeight();
  const recMarketplace = getRecMarketplaceContractInstance();

  // Fetch Redeem events from the chain, we will only handle one of them as it is most likely the one
  // we are looking for
  const tokenRedeemed = await recMarketplace.queryFilter(
    recMarketplace.filters.Redeem(owner, tokenId, amount),
    blockHeight,
  );

  const prisma = new PrismaClient();

  const redeemData = {
    tokenId: tokenId.toString(),
    // Disabling eslint rule which poses problem at assignment (prisma issue here)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    eventType: EventType.REDEEM,
    data: {
      owner,
      tokenId: tokenId.toString(),
      amount: amount.toString(),
    },
    blockHeight: blockHeight.toString(),
    transactionHash: tokenRedeemed[0].transactionHash,
    logIndex: tokenRedeemed[0].logIndex,
  };
  await prisma.event
    .upsert({
      where: {
        blockHeight_transactionHash_logIndex: {
          blockHeight: blockHeight.toString(),
          transactionHash: tokenRedeemed[0].transactionHash,
          logIndex: tokenRedeemed[0].logIndex,
        },
      },
      update: redeemData,
      create: redeemData,
    })
    .catch(() => {
      console.log(
        `could not create REDEEM event for token: ${tokenId.toString()}`,
      );
    });
};
