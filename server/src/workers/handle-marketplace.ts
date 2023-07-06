import { BigNumber } from 'ethers';
import { EventType, PrismaClient } from '@prisma/client';
import { getCurrentBlockHeight, getRecMarketplaceContractInstance } from '../utils/web3-utils';

export const handleList = async (
    prisma: PrismaClient,
    blockHeight: number,
    transactionHash: string,
    logIndex: number,
    seller: string,
    tokenId: BigNumber,
    tokenAmount: BigNumber,
    price: BigNumber,
) => {
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
        transactionHash: transactionHash,
        logIndex: logIndex,
        collectionId: collection.id,
    };
    await prisma.event
        .upsert({
            where: {
                blockHeight_transactionHash_logIndex: {
                    blockHeight: blockHeight.toString(),
                    transactionHash: transactionHash,
                    logIndex: logIndex,
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
    prisma: PrismaClient,
    blockHeight: number,
    transactionHash: string,
    logIndex: number,
    buyer: string,
    seller: string,
    tokenId: BigNumber,
    tokenAmount: BigNumber,
    price: BigNumber,
) => {
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
        transactionHash: transactionHash,
        logIndex: logIndex,
        collectionId: collection.id,
    };
    await prisma.event
        .upsert({
            where: {
                blockHeight_transactionHash_logIndex: {
                    blockHeight: blockHeight.toString(),
                    transactionHash: transactionHash,
                    logIndex: logIndex,
                },
            },
            update: boughtData,
            create: boughtData,
        })
        .catch(() => {
            console.error(`could not create BUY event for token: ${tokenId.toString()}`);
        });
};
