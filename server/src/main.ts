import { createYoga } from 'graphql-yoga';
import { createServer } from 'http';
import { schema } from './schemas/schema';
import { createContext } from './context';
import { getPortEnv, loadEnv } from './utils/env';
import { searchNewBlock } from './workers';
import { getEwfContractsInstances, initChainUtils, initRoles } from './utils/web3-utils';
import { constructRolesTable } from './seeds/seed-roles';
import { BigNumber, constants, Event } from 'ethers';
import { seedEwcData } from './seeds/seed-ewc-data';
import { bridgeTransactions } from './utils/bridge';
import { prisma } from '@prisma/client';

async function main() {
    // Load environment variable to ensure that they are properly set
    loadEnv();

    const context = createContext();

    // initialize roles values from on-chain data
    await initRoles().catch((err: Error) =>
        console.error(`Error while trying to initialize Roles globals: ${err.message}`),
    );

    // initialize chain utils in database
    await initChainUtils(context.prisma).catch((err: Error) =>
        console.error(`Error while trying to initialize chain utils in DB: ${err.message}`),
    );

    // Seed role table
    await constructRolesTable(context.prisma).catch((err: Error) =>
        console.error(`Error while trying to seed roles table: ${err.message}`),
    );

    // Seed EWC data
    await seedEwcData(context.prisma).catch((err: Error) =>
        console.error(`Error while trying to seed energy web chain data: ${err.message}`),
    );

    // Start bridge
    bridgeTransactions(context.prisma).catch((err: Error) =>
        console.error(`Error while trying to bridge: ${err.message}`),
    );

    const yoga = createYoga({ schema, context, plugins: [] });
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const server = createServer(yoga);

    searchNewBlock(context.prisma).catch((err: Error) =>
        console.error(`Error while looking for a new block: ${err.message}`),
    );

    server.listen(getPortEnv(), () => {
        console.info(`Server is running on port ${getPortEnv()}`);
    });
}

main().catch(console.error);
