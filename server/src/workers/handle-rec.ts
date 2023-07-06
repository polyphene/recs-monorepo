import { BigNumber, Contract } from 'ethers';
import { getCurrentBlockHeight, getRecMarketplaceContractInstance } from '../utils/web3-utils';
import { EventType, PrismaClient } from '@prisma/client';
import { sleep } from '../utils/sleep';

async function checkNodeDataUpToDate(
    recMarketplaceContract: Contract,
    expectedId: BigNumber,
    maxRetries = 3,
    currentRetry = 0,
): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const id: BigNumber = await recMarketplaceContract.nextId();
    if (!id.gt(expectedId)) {
        if (currentRetry < maxRetries) {
            console.warn(
                `node not yet up to date (nextId=${id.toString()},id=${expectedId.toString()},try=${
                    currentRetry + 1
                },limit=${maxRetries}), retrying...`,
            );
            await sleep(5000);
            await checkNodeDataUpToDate(recMarketplaceContract, expectedId, maxRetries, currentRetry + 1); // Recursive call
            return;
        } else {
            throw new Error('Max retries exceeded');
        }
    } else {
        console.info(`node up to date for token ID ${expectedId.toString()}`);
    }
}
export const handleMint = async (
    prisma: PrismaClient,
    blockHeight: number,
    transactionHash: string,
    logIndex: number,
    operator: string,
    from: string,
    to: string,
    id: BigNumber,
    value: BigNumber,
) => {
    const recMarketplace = getRecMarketplaceContractInstance();

    // This is quite bad, but sometimes we get a new block but the transactions are not yet taken into account in Lotus
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    await checkNodeDataUpToDate(recMarketplace, id, 5).catch((err: Error) => {
        console.error(`could not fetch data for transaction ${transactionHash} in block: ${blockHeight}`);
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
    const uri: string = await recMarketplace.uri(id);

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
            console.error(`could not upsert collection for metadata Id: ${metadata.id}`);
        });
    if (!collection) {
        throw new Error(`no collection object in database for metadata Id: ${metadata.id}`);
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
        transactionHash: transactionHash,
        logIndex: logIndex,
        collectionId: collection.id,
    };
    // Upsert ensures that we are only having one event record per event
    await prisma.event
        .upsert({
            where: {
                blockHeight_transactionHash_logIndex: {
                    blockHeight: blockHeight.toString(),
                    transactionHash: transactionHash,
                    logIndex: logIndex,
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
    prisma: PrismaClient,
    blockHeight: number,
    transactionHash: string,
    logIndex: number,
    operator: string,
    from: string,
    to: string,
    id: BigNumber,
    value: BigNumber,
) => {
    const collection = await prisma.collection
        .findUnique({
            where: {
                filecoinTokenId: id.toString(),
            },
        })
        .catch(() => console.error(`could not look for collection with filecoin token Id: ${id.toString()}`));
    if (!collection) {
        throw new Error(`no collection object in database for filecoin token Id: ${id.toString()}`);
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
            update: transferData,
            create: transferData,
        })
        .catch(() => {
            console.error(`could not create TRANSFER event for token: ${id.toString()}`);
        });
};

export const handleRedeem = async (
    prisma: PrismaClient,
    blockHeight: number,
    transactionHash: string,
    logIndex: number,
    owner: string,
    tokenId: BigNumber,
    amount: BigNumber,
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

    const redeemData = {
        tokenId: tokenId.toString(),
        eventType: EventType.REDEEM,
        data: {
            owner,
            tokenId: tokenId.toString(),
            amount: amount.toString(),
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
            update: redeemData,
            create: redeemData,
        })
        .catch(() => {
            console.error(`could not create REDEEM event for token: ${tokenId.toString()}`);
        });
};
