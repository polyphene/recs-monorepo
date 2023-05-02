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
  const metadata = await prisma.metadata
    .update({
      where: {
        cid: uri,
      },
      data: {
        minted: true,
      },
    })
    .catch(() => {
      console.error(`could not update metadata.minted to true for cid: ${uri}`);
    });

  if (!metadata) {
    throw new Error(`no metadata object in database for: ${uri}`);
  }

  // Set upsert a collection for this token Id
  const collection = await prisma.collection
    .upsert({
      where: {
        metadataId: metadata.id,
      },
      create: {
        filecoinTokenId: id.toString(),
        metadataId: metadata.id,
      },
      update: {
        filecoinTokenId: id.toString(),
      },
    })
    .catch(() => {
      console.error(
        `could not upsert collection for metadata Id: ${metadata.id}`,
      );
    });
  if (!collection) {
    throw new Error(
      `no collection object in database for metadata Id: ${metadata.id}`,
    );
  }

  const mintData = {
    tokenId: id.toString(),
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
    collectionId: collection.id,
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
      console.error(`could not create MINT event for token: ${id.toString()}`);
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

  const collection = await prisma.collection
    .findUnique({
      where: {
        filecoinTokenId: id.toString(),
      },
    })
    .catch(() =>
      console.error(
        `could not look for collection with filecoin token Id: ${id.toString()}`,
      ),
    );
  if (!collection) {
    throw new Error(
      `no collection object in database for filecoin token Id: ${id.toString()}`,
    );
  }

  const transferData = {
    tokenId: id.toString(),
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
    collectionId: collection.id,
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
      console.error(
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

  const collection = await prisma.collection
    .findUnique({
      where: {
        filecoinTokenId: tokenId.toString(),
      },
    })
    .catch(() =>
      console.error(
        `could not look for collection with filecoin token Id: ${tokenId.toString()}`,
      ),
    );
  if (!collection) {
    throw new Error(
      `no collection object in database for filecoin token Id: ${tokenId.toString()}`,
    );
  }

  const redeemData = {
    tokenId: tokenId.toString(),
    eventType: EventType.REDEEM,
    data: {
      owner,
      tokenId: tokenId.toString(),
      amount: amount.toString(),
    },
    blockHeight: blockHeight.toString(),
    transactionHash: tokenRedeemed[0].transactionHash,
    logIndex: tokenRedeemed[0].logIndex,
    collectionId: collection.id,
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
      console.error(
        `could not create REDEEM event for token: ${tokenId.toString()}`,
      );
    });
};
