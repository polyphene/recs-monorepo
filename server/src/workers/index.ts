import { getEthHttpUriEnv, getEthWssUriEnv, getRecMarketplaceAddressEnv } from '../utils/env';
import recMarketplace from '../config/rec-marketplace';
import { constants, ethers } from 'ethers';
import { Contract, BigNumber } from 'ethers';
import { handleMint, handleRedeem, handleTransfer } from './handle-rec';
import { handleBuy, handleList } from './handle-marketplace';
import { handleGrantRole, handleRevokeRole } from './handle-roles';
import { WebSocketProvider } from '../utils/web3-socket-provider';
import { PrismaClient } from '@prisma/client';
import { sleep } from '../utils/sleep';

type TransferSingleArgs = {
    operator: string;
    from: string;
    to: string;
    id: BigNumber;
    value: BigNumber;
};

type RedeemArgs = {
    owner: string;
    tokenId: BigNumber;
    amount: BigNumber;
};

type TokenListedArgs = {
    seller: string;
    tokenId: BigNumber;
    tokenAmount: BigNumber;
    price: BigNumber;
};

type TokenBoughtArgs = {
    buyer: string;
    seller: string;
    tokenId: BigNumber;
    tokenAmount: BigNumber;
    price: BigNumber;
};

type RoleGrantedArgs = {
    role: string;
    account: string;
    sender: string;
};

type RoleRevokedArgs = {
    role: string;
    account: string;
    sender: string;
};

export const searchNewBlock = async (prisma: PrismaClient) => {
    const recMarketplaceAddress = getRecMarketplaceAddressEnv();
    const provider = ethers.getDefaultProvider(getEthHttpUriEnv());

    const utils = await prisma.utils
        .findUnique({
            where: {
                id: 1,
            },
        })
        .catch(() => {
            console.error(`could not find data utils`);
        });

    if (!utils) {
        throw Error('Utils table should be properly initialize before searching for a new block');
    }

    console.info(`looking for valid transaction in block ${utils.filecoinBlockHeight}`);

    provider
        .getBlockWithTransactions(parseInt(utils.filecoinBlockHeight, 10))
        .then(async block => {
            const contract = new Contract(recMarketplaceAddress, recMarketplace.abi, provider);

            // Loop through all transactions in the block
            for (const transaction of block.transactions) {
                // Check if the transaction was to the contract
                if (transaction.to !== recMarketplaceAddress) {
                    continue;
                }

                console.info(`[FILECOIN] Found transaction ${transaction.hash} in block ${block.number}`);
                // Get the receipt
                const receipt = await provider.getTransactionReceipt(transaction.hash);

                // Parse the logs with the contract interface
                for (const log of receipt.logs) {
                    const parsedLog = contract.interface.parseLog(log);
                    // Check if it's events we're interested in
                    switch (parsedLog.name) {
                        case 'TransferSingle':
                            {
                                const { operator, from, to, id, value }: TransferSingleArgs =
                                    parsedLog.args as unknown as TransferSingleArgs;

                                console.info(
                                    `[FILECOIN] Received 'TransferSingle' event: [operator=${operator}, from=${from}, to=${to}, id=${id.toString()}, value=${value.toString()}]`,
                                );
                                // Check if mint
                                if (from === constants.AddressZero) {
                                    await handleMint(
                                        prisma,
                                        block.number,
                                        transaction.hash,
                                        log.logIndex,
                                        operator,
                                        from,
                                        to,
                                        id,
                                        value,
                                    ).catch((err: Error) => {
                                        console.warn(
                                            `could not handle mint event for tokenId ${id.toString()}: ${err.message}`,
                                        );
                                    });
                                } else {
                                    await handleTransfer(
                                        prisma,
                                        block.number,
                                        transaction.hash,
                                        log.logIndex,
                                        operator,
                                        from,
                                        to,
                                        id,
                                        value,
                                    ).catch((err: Error) =>
                                        console.warn(
                                            `could not handle transfer event for tokenId ${id.toString()}: ${
                                                err.message
                                            }`,
                                        ),
                                    );
                                }
                            }
                            break;

                        case 'Redeem':
                            {
                                const { owner, tokenId, amount }: RedeemArgs = parsedLog.args as unknown as RedeemArgs;

                                console.info(
                                    `[FILECOIN] Received 'Redeem' event: [owner=${owner}, tokenId=${tokenId.toString()}, amount=${amount.toString()}]`,
                                );
                                await handleRedeem(
                                    prisma,
                                    block.number,
                                    transaction.hash,
                                    log.logIndex,
                                    owner,
                                    tokenId,
                                    amount,
                                ).catch((err: Error) =>
                                    console.warn(
                                        `could not handle redeem event for tokenId ${tokenId.toString()}: ${
                                            err.message
                                        }`,
                                    ),
                                );
                            }
                            break;

                        case 'TokenListed':
                            {
                                const { seller, tokenId, tokenAmount, price }: TokenListedArgs =
                                    parsedLog.args as unknown as TokenListedArgs;

                                console.info(
                                    `[FILECOIN] Received 'TokenListed' event: [seller=${seller}, tokenId=${tokenId.toString()}, tokenAmount=${tokenAmount.toString()}, price=${price.toString()}]`,
                                );
                                await handleList(
                                    prisma,
                                    block.number,
                                    transaction.hash,
                                    log.logIndex,
                                    seller,
                                    tokenId,
                                    tokenAmount,
                                    price,
                                ).catch((err: Error) =>
                                    console.warn(
                                        `could not handle list event for tokenId ${tokenId.toString()}: ${err.message}`,
                                    ),
                                );
                            }
                            break;

                        case 'TokenBought':
                            {
                                const { buyer, seller, tokenId, tokenAmount, price }: TokenBoughtArgs =
                                    parsedLog.args as unknown as TokenBoughtArgs;

                                console.info(
                                    `[FILECOIN] Received 'TokenBought' event: [buyer=${buyer}, seller=${seller}, tokenId=${tokenId.toString()}, tokenAmount=${tokenAmount.toString()}, price=${price.toString()}]`,
                                );
                                await handleBuy(
                                    prisma,
                                    block.number,
                                    transaction.hash,
                                    log.logIndex,
                                    buyer,
                                    seller,
                                    tokenId,
                                    tokenAmount,
                                    price,
                                ).catch((err: Error) =>
                                    console.warn(
                                        `could not handle buy event for tokenId ${tokenId.toString()}: ${err.message}`,
                                    ),
                                );
                            }
                            break;

                        case 'RoleGranted':
                            {
                                const { role, account, sender }: RoleGrantedArgs =
                                    parsedLog.args as unknown as RoleGrantedArgs;

                                console.info(
                                    `[FILECOIN] Received 'RoleGranted' event: [role=${role}, account=${account}, sender=${sender}]`,
                                );
                                handleGrantRole(
                                    prisma,
                                    block.number,
                                    transaction.hash,
                                    log.logIndex,
                                    role,
                                    account,
                                    sender,
                                ).catch((err: Error) =>
                                    console.warn(
                                        `could not handle grant role ${role} event for address ${account}: ${err.message}`,
                                    ),
                                );
                            }
                            break;

                        case 'RoleRevoked':
                            {
                                const { role, account, sender }: RoleRevokedArgs =
                                    parsedLog.args as unknown as RoleRevokedArgs;

                                console.info(
                                    `[FILECOIN] Received 'RoleRevoked' event: [role=${role}, account=${account}, sender=${sender}]`,
                                );
                                await handleRevokeRole(
                                    prisma,
                                    block.number,
                                    transaction.hash,
                                    log.logIndex,
                                    role,
                                    account,
                                    sender,
                                ).catch((err: Error) => {
                                    console.warn(
                                        `could not handle revoke role ${role} event for address ${account}: ${err.message}`,
                                    );
                                });
                            }
                            break;

                        default:
                            break;
                    }
                }
            }

            await prisma.utils
                .update({
                    where: { id: utils.id },
                    data: { filecoinBlockHeight: (block.number + 1).toString() },
                })
                .catch((err: Error) => {
                    throw Error(
                        `could not update chain utils in DB after handling block ${block.number}: ${err.message}`,
                    );
                });

            await sleep(3000);
            void searchNewBlock(prisma);
        })
        .catch(async (err: Error) => {
            if (!err.message.includes('requested a future epoch')) {
                console.warn(
                    `error while looking for valid transaction in block ${utils.filecoinBlockHeight}: ${err.message}`,
                );
            }

            if (err.message.includes('requested epoch was a null round')) {
                await prisma.utils
                    .update({
                        where: { id: utils.id },
                        data: { filecoinBlockHeight: (parseInt(utils.filecoinBlockHeight, 10) + 1).toString() },
                    })
                    .catch((err: Error) => {
                        throw Error(
                            `could not update chain utils in DB after handling block is a null round: ${err.message}`,
                        );
                    });
            }

            await sleep(3000);
            void searchNewBlock(prisma);
        });
};
