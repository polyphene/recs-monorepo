import { BigNumber } from 'ethers';
import { EventType, PrismaClient } from '@prisma/client';
import { getCurrentBlockHeight } from '../utils/web3-utils';

export const handleList = async (
  seller: string,
  tokenId: BigNumber,
  tokenAmount: BigNumber,
  price: BigNumber,
) => {
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
        blockHeight: (await getCurrentBlockHeight()).toString(),
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
        blockHeight: (await getCurrentBlockHeight()).toString(),
      },
    })
    .catch(() => {
      console.log(
        `could not create BUY event for token: ${tokenId.toString()}`,
      );
    });
};
