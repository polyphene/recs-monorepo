import { createYoga } from 'graphql-yoga';
import { createServer } from 'http';
import { schema } from './schemas/schema';
import { createContext } from './context';
import { getPortEnv, loadEnv } from './utils/env';

function main() {
  // Load environment variable to ensure that they are porperly set
  loadEnv();

  const yoga = createYoga({ schema, context: createContext, plugins: [] });
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const server = createServer(yoga);
  server.listen(getPortEnv(), () => {
    console.info(`Server is running on port ${getPortEnv()}`);
  });
}

main();
