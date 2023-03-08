import { createYoga } from 'graphql-yoga';
import { createServer } from 'http';
import { schema } from './schemas/schema';
import { createContext } from './context';
import { getPortEnv, loadEnv } from './utils/env';
import { startWorkers } from './workers';
import { initRoles } from './utils/web3-utils';
import { constructRolesTable } from './seeds/seed-roles';

async function main() {
  // Load environment variable to ensure that they are properly set
  loadEnv();

  // initialize roles values from on-chain data
  await initRoles();

  // Seed role table
  await constructRolesTable();

  const yoga = createYoga({ schema, context: createContext, plugins: [] });
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const server = createServer(yoga);

  startWorkers();

  server.listen(getPortEnv(), () => {
    console.info(`Server is running on port ${getPortEnv()}`);
  });
}

main().catch(() => console.log("couldn't start graphQL server"));
