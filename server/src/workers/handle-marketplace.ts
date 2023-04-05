import { BigNumber } from 'ethers';
import { EventType, PrismaClient } from '@prisma/client';
import {
  getCurrentBlockHeight,
  getRecMarketplaceContractInstance,
} from '../utils/web3-utils';

export const handleList = async (
  seller: string,
  tokenId: BigNumber,
  tokenAmount: BigNumber,
  price: BigNumber,
) => {
  // Get event metadata
  const blockHeight = await getCurrentBlockHeight();
  const recMarketplace = getRecMarketplaceContractInstance();

  // Fetch TokenListed events from the chain, we will only handle one of them as it is most likely the one
  // we are looking for
  const tokenListedEvents = await recMarketplace.queryFilter(
    recMarketplace.filters.TokenListed(seller, tokenId, tokenAmount, price),
    blockHeight,
  );

  const prisma = new PrismaClient();

  await prisma.event
    .create({
      data: {
        tokenId: tokenId.toString(),
        // Disabling eslint rule which poses problem at assignment (prisma issue here)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        eventType: EventType.LIST,
        data: {
          seller,
          tokenId: tokenId.toString(),
          tokenAmount: tokenAmount.toString(),
          price: price.toString(),
        },
        blockHeight: blockHeight.toString(),
        transactionHash: tokenListedEvents[0].transactionHash,
        logIndex: tokenListedEvents[0].logIndex,
      },
    })
    .catch(() => {
      console.log(
        `could not create LIST event for token: ${tokenId.toString()}`,
      );
    });
};

export const handleBuy = async (
  buyer: string,
  seller: string,
  tokenId: BigNumber,
  tokenAmount: BigNumber,
  price: BigNumber,
) => {
  // Get event metadata
  const blockHeight = await getCurrentBlockHeight();
  const recMarketplace = getRecMarketplaceContractInstance();

  // Fetch TokenBought events from the chain, we will only handle one of them as it is most likely the one
  // we are looking for
  const tokenBoughtEvents = await recMarketplace.queryFilter(
    recMarketplace.filters.TokenBought(
      buyer,
      seller,
      tokenId,
      tokenAmount,
      price,
    ),
    blockHeight,
  );

  const prisma = new PrismaClient();

  await prisma.event
    .create({
      data: {
        tokenId: tokenId.toString(),
        // Disabling eslint rule which poses problem at assignment (prisma issue here)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        eventType: EventType.BUY,
        data: {
          buyer,
          seller,
          tokenId: tokenId.toString(),
          tokenAmount: tokenAmount.toString(),
          price: price.toString(),
        },
        blockHeight: blockHeight.toString(),
        transactionHash: tokenBoughtEvents[0].transactionHash,
        logIndex: tokenBoughtEvents[0].logIndex,
      },
    })
    .catch(() => {
      console.log(
        `could not create BUY event for token: ${tokenId.toString()}`,
      );
    });
};
