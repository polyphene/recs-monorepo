import { BigNumber } from 'ethers';
import { getRecMarketplaceContractInstance } from '../utils/web3-utils';
import { EventType, PrismaClient } from '@prisma/client';

export const handleMint = async (
  operator: string,
  from: string,
  to: string,
  id: BigNumber,
  value: BigNumber,
) => {
  const recMarketplace = getRecMarketplaceContractInstance();

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

  await prisma.event
    .create({
      data: {
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
      },
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
  const prisma = new PrismaClient();

  await prisma.event
    .create({
      data: {
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
      },
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
  const prisma = new PrismaClient();

  await prisma.event
    .create({
      data: {
        tokenId: tokenId.toString(),
        // Disabling eslint rule which poses problem at assignment (prisma issue here)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        eventType: EventType.REDEEM,
        data: {
          owner,
          tokenId: tokenId.toString(),
          amount: amount.toString(),
        },
      },
    })
    .catch(() => {
      console.log(
        `could not create REDEEM event for token: ${tokenId.toString()}`,
      );
    });
};
