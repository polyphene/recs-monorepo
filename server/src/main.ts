import { createYoga } from 'graphql-yoga';
import { createServer } from 'http';
import { schema } from './schemas/schema';
import { createContext } from './context';
import { getPortEnv, loadEnv } from './utils/env';
import { startFilecoinListeners } from './workers';
import { getEwfContractsInstances, initRoles } from './utils/web3-utils';
import { constructRolesTable } from './seeds/seed-roles';
import { BigNumber, constants, Event } from 'ethers';
import { seedEwcData } from './seeds/seed-ewc-data';

async function main() {
    // Load environment variable to ensure that they are properly set
    loadEnv();

    // initialize roles values from on-chain data
    await initRoles().catch((err: Error) =>
        console.error(`Error while trying to initialize Roles globals: ${err.message}`),
    );

    // Seed role table
    await constructRolesTable().catch((err: Error) =>
        console.error(`Error while trying to seed roles table: ${err.message}`),
    );

    // Seed EWC data
    await seedEwcData().catch((err: Error) =>
        console.error(`Error while trying to seed energy web chain data: ${err.message}`),
    );

    const yoga = createYoga({ schema, context: createContext, plugins: [] });
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const server = createServer(yoga);

    startFilecoinListeners();

    server.listen(getPortEnv(), () => {
        console.info(`Server is running on port ${getPortEnv()}`);
    });
}

main().catch(console.error);
