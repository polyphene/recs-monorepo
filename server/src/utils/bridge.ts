/*
eslint {
  @typescript-eslint/no-unsafe-member-access: 0,
  @typescript-eslint/no-unsafe-assignment: 0,
  @typescript-eslint/no-unsafe-call: 0,
  @typescript-eslint/no-unsafe-return: 0,
  @typescript-eslint/ban-ts-comment: 0
}
*/
import { PrismaClient } from '@prisma/client';
import { getSignerRecMarketplaceContractInstance } from './web3-utils';
import { sleep } from './sleep';

export const bridgeTransactions = async (prisma: PrismaClient): Promise<void> => {
    console.info(`looking for transaction to bridge...`);
    const recMarketplaceContractInstance = getSignerRecMarketplaceContractInstance();

    const transaction = await prisma.transaction.findFirst({ where: { hash: null } }).catch(async (err: Error) => {
        console.error(`couldn't find latest transaction: ${err.message}`);

        await sleep(1000 * 10);
        bridgeTransactions(prisma).catch((err: Error) =>
            console.error(`error while bridging transaction: ${err.message}`),
        );
    });

    if (!transaction || !transaction.rawArgs) {
        console.info(`no transaction found, sleeping...`);
        // Try again in 2 min
        await sleep(1000 * 10);
        bridgeTransactions(prisma).catch((err: Error) =>
            console.error(`error while bridging transaction: ${err.message}`),
        );
        return;
    }
    console.info(`found transaction with args: ${JSON.stringify(transaction.rawArgs)}`);

    const tx = await recMarketplaceContractInstance.mintAndAllocate(
        // @ts-ignore
        transaction.rawArgs[0],
        // @ts-ignore
        transaction.rawArgs[1],
        // TODO need to solve safeTransferFrom failing for addresses of miners (miner addresses are effectively contracts
        // deployed on the Filecoin network)
        // @ts-ignore
        transaction.rawArgs[3].map(t => {
            return '0x472a30119CaDCEdD4cC9167eA5A390357ebc5abC';
        }),
        // @ts-ignore
        transaction.rawArgs[3],
        // @ts-ignore
        transaction.rawArgs[4],
    );

    // Wait for transaction to be mined
    const receipt = await tx.wait().catch(async (err: Error) => {
        console.error(`error while waiting for tx receipt: ${err.message}`);

        await sleep(1000 * 10);
        bridgeTransactions(prisma).catch((err: Error) =>
            console.error(`error while bridging transaction: ${err.message}`),
        );
    });

    console.info(`got receipt with transaction hash: ${receipt.transactionHash as string}`);

    await prisma.transaction
        .update({
            where: {
                id: transaction.id,
            },
            data: {
                hash: receipt.transactionHash,
                success: true,
            },
        })
        .then(() => {
            console.info(`updated transaction object in database`);

            bridgeTransactions(prisma).catch((err: Error) =>
                console.error(`error while bridging transaction: ${err.message}`),
            );
        })
        .catch(async (err: Error) => {
            console.error(`couldn't update transaction information for transaction: ${transaction.id}`);

            await sleep(1000 * 10);
            bridgeTransactions(prisma).catch((err: Error) =>
                console.error(`error while bridging transaction: ${err.message}`),
            );
        });
};
