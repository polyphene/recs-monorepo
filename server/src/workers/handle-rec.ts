import { BigNumber, Contract, constants } from 'ethers';
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

    // Upsert a user document
    const user = await prisma.user
        .upsert({
            where: {
                address: to,
            },
            create: {
                address: to,
                isMinter: true,
            },
            update: {},
        })
        .catch(() => {
            console.error(`could not upsert user on mint for address: ${to}`);
        });

    if (!user) {
        console.error(`could not find user on mint for address: ${to}`);
    }

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

    // Upsert user balance
    await prisma.balance.create({
        data: {
            amount: value.toString(),
            user: {
                connect: {
                    id: user?.id,
                },
            },
            collection: {
                connect: {
                    id: collection.id,
                },
            },
        },
    });

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

    // If not a mint transfer update sender balance
    if (from != constants.AddressZero) {
        const balance = await prisma.balance
            .findUnique({
                where: {
                    userAddress_collectionId: {
                        userAddress: from,
                        collectionId: collection.id,
                    },
                },
            })
            .catch(() =>
                console.error(
                    `could not look for balance of pair user.address/collection.id: ${from}/${collection.id}`,
                ),
            );

        if (!balance) {
            console.error(`could not find balance for user.address/collection.id: ${from}/${collection.id}`);
        }

        const updatedAmount = BigNumber.from(balance?.amount).sub(value);
        await prisma.balance
            .update({
                where: {
                    id: balance?.id,
                },
                data: {
                    amount: updatedAmount.toString(),
                },
            })
            .catch(() =>
                console.error(
                    `could not update balance with new amount of pair user.address/collection.id: ${from}/${
                        collection.id
                    } - ${updatedAmount.toString()}`,
                ),
            );
    }

    // If not a burn transfer update receiver balance
    if (to != constants.AddressZero) {
        const balance = await prisma.balance
            .findUnique({
                where: {
                    userAddress_collectionId: {
                        userAddress: to,
                        collectionId: collection.id,
                    },
                },
            })
            .catch(() =>
                console.error(`could not look for balance of pair user.address/collection.id: ${to}/${collection.id}`),
            );

        if (!balance) {
            console.error(`could not find balance for user.address/collection.id: ${to}/${collection.id}`);
        }

        // No balance for address yet
        if (balance === null) {
            await prisma.balance.create({
                data: {
                    user: {
                        connectOrCreate: {
                            where: {
                                address: to,
                            },
                            create: {
                                address: to,
                            },
                        },
                    },
                    amount: value.toString(),
                    collection: {
                        connect: {
                            id: collection.id,
                        },
                    },
                },
            });
        } else {
            // Balance exists
            const updatedAmount = BigNumber.from(balance?.amount).add(value);
            await prisma.balance
                .update({
                    where: {
                        id: balance?.id,
                    },
                    data: {
                        amount: updatedAmount.toString(),
                    },
                })
                .catch(() =>
                    console.error(
                        `could not update balance with new amount of pair user.address/collection.id: ${to}/${
                            collection.id
                        } - ${updatedAmount.toString()}`,
                    ),
                );
        }
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

    const balance = await prisma.balance
        .findUnique({
            where: {
                userAddress_collectionId: {
                    userAddress: owner,
                    collectionId: collection.id,
                },
            },
        })
        .catch(() =>
            console.error(`could not look for balance of pair user.address/collection.id: ${owner}/${collection.id}`),
        );

    if (balance) {
        const updatedRedeem = BigNumber.from(balance.redeemed).add(amount);
        await prisma.balance
            .update({
                where: {
                    userAddress_collectionId: {
                        userAddress: owner,
                        collectionId: collection.id,
                    },
                },
                data: {
                    redeemed: updatedRedeem.toString(),
                },
            })
            .catch(() =>
                console.error(
                    `could not update redeem amount of pair user.address/collection.id: ${owner}/${collection.id}`,
                ),
            );
    } else {
        console.error(`could not find balance for user.address/collection.id: ${owner}/${collection.id}`);
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

export const handleRedemptionStatementSet = async (
    prisma: PrismaClient,
    blockHeight: number,
    transactionHash: string,
    logIndex: number,
    minter: string,
    tokenId: BigNumber,
    cid: string,
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

    await prisma.collection
        .update({
            where: {
                id: collection.id,
            },
            data: {
                redemptionStatement: cid,
            },
        })
        .catch(() =>
            console.error(
                `could not update redemption statement for collection with filecoin token Id: ${tokenId.toString()} - ${cid}`,
            ),
        );

    const redemptionStatementSetData = {
        tokenId: tokenId.toString(),
        eventType: EventType.REDEMPTION_STATEMENT_SET,
        data: {
            minter,
            tokenId: tokenId.toString(),
            cid,
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
            update: redemptionStatementSetData,
            create: redemptionStatementSetData,
        })
        .catch(() => {
            console.error(`could not create REDEEM event for token: ${tokenId.toString()}`);
        });
};
