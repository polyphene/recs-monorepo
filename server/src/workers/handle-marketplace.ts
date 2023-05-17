import { BigNumber } from 'ethers';
import { EventType, PrismaClient } from '@prisma/client';
import { getCurrentBlockHeight, getRecMarketplaceContractInstance } from '../utils/web3-utils';

export const handleList = async (seller: string, tokenId: BigNumber, tokenAmount: BigNumber, price: BigNumber) => {
    // Get event metadata
    const blockHeight = await getCurrentBlockHeight();
    const recMarketplace = getRecMarketplaceContractInstance();

    // Fetch TokenListed events from the chain, we will only handle one of them as it is most likely the one
    // we are looking for
    const tokenListed = await recMarketplace.queryFilter(
        recMarketplace.filters.TokenListed(seller, tokenId),
        blockHeight,
    );

    const prisma = new PrismaClient();

    const collection = await prisma.collection
        .findUnique({
            where: {
                filecoinTokenId: tokenId.toString(),
            },
        })
        .catch(() => console.error(`could not look for collection with filecoin token Id: ${tokenId.toString()}`));
    if (!collection) {
        throw new Error(`no collection object in database for filecoin token Id: ${tokenId.toString()}`);
    }

    const listedData = {
        tokenId: tokenId.toString(),
        eventType: EventType.LIST,
        data: {
            seller,
            tokenId: tokenId.toString(),
            tokenAmount: tokenAmount.toString(),
            price: price.toString(),
        },
        blockHeight: blockHeight.toString(),
        transactionHash: tokenListed[0].transactionHash,
        logIndex: tokenListed[0].logIndex,
        collectionId: collection.id,
    };
    await prisma.event
        .upsert({
            where: {
                blockHeight_transactionHash_logIndex: {
                    blockHeight: blockHeight.toString(),
                    transactionHash: tokenListed[0].transactionHash,
                    logIndex: tokenListed[0].logIndex,
                },
            },
            update: listedData,
            create: listedData,
        })
        .catch(() => {
            console.error(`could not create LIST event for token: ${tokenId.toString()}`);
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
    const tokenBought = await recMarketplace.queryFilter(
        recMarketplace.filters.TokenBought(buyer, seller, tokenId),
        blockHeight,
    );

    const prisma = new PrismaClient();

    const collection = await prisma.collection
        .findUnique({
            where: {
                filecoinTokenId: tokenId.toString(),
            },
        })
        .catch(() => console.error(`could not look for collection with filecoin token Id: ${tokenId.toString()}`));
    if (!collection) {
        throw new Error(`no collection object in database for filecoin token Id: ${tokenId.toString()}`);
    }

    const boughtData = {
        tokenId: tokenId.toString(),
        eventType: EventType.BUY,
        data: {
            buyer,
            seller,
            tokenId: tokenId.toString(),
            tokenAmount: tokenAmount.toString(),
            price: price.toString(),
        },
        blockHeight: blockHeight.toString(),
        transactionHash: tokenBought[0].transactionHash,
        logIndex: tokenBought[0].logIndex,
        collectionId: collection.id,
    };
    await prisma.event
        .upsert({
            where: {
                blockHeight_transactionHash_logIndex: {
                    blockHeight: blockHeight.toString(),
                    transactionHash: tokenBought[0].transactionHash,
                    logIndex: tokenBought[0].logIndex,
                },
            },
            update: boughtData,
            create: boughtData,
        })
        .catch(() => {
            console.error(`could not create BUY event for token: ${tokenId.toString()}`);
        });
};
