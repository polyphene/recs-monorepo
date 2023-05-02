import { createYoga } from 'graphql-yoga';
import { createServer } from 'http';
import { schema } from './schemas/schema';
import { createContext } from './context';
import { getPortEnv, loadEnv } from './utils/env';
import { startWorkers } from './workers';
import { getEwfContractsInstances, initRoles } from './utils/web3-utils';
import { constructRolesTable } from './seeds/seed-roles';
import { BigNumber, constants, Event } from 'ethers';

async function main() {
  // Load environment variable to ensure that they are properly set
  loadEnv();

  // initialize roles values from on-chain data
  await initRoles().catch((err: Error) =>
    console.error(
      `Error while trying to initialize Roles globals: ${err.message}`,
    ),
  );

  // Seed role table
  await constructRolesTable().catch((err: Error) =>
    console.error(`Error while trying to seed roles table: ${err.message}`),
  );

  const yoga = createYoga({ schema, context: createContext, plugins: [] });
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const server = createServer(yoga);

  startWorkers();

  const { registryExtendedContract, batchFactoryContract } =
    getEwfContractsInstances();

  const mintEvents = await registryExtendedContract.queryFilter(
    registryExtendedContract.filters.TransferSingle(
      null,
      constants.AddressZero,
    ),
  );

  const redemptionSetEvents = await batchFactoryContract.queryFilter(
    batchFactoryContract.filters.RedemptionStatementSet(),
  );

  const certificateBatchMintedEvents = await batchFactoryContract.queryFilter(
    batchFactoryContract.filters.CertificateBatchMinted(),
  );

  const claimSingleEvents = await registryExtendedContract.queryFilter(
    registryExtendedContract.filters.ClaimSingle(),
  );

  const batches: {
    [key: string]: {
      id: string;
      redemptionStatement: string;
      certificates: {
        certificateId: BigNumber;
        value: BigNumber;
        mintEvent: Event;
        claims: {
          claimSingleEvent: Event;
          claimSubject: string;
          value: BigNumber;
        }[];
      }[];
      redemptionSetEvent: Event;
    };
  } = {} as {
    batchId: {
      id: string;
      redemptionStatement: string;
      certificates: {
        certificateId: BigNumber;
        value: BigNumber;
        mintEvent: Event;
        claims: {
          claimSingleEvent: Event;
          claimSubject: string;
          value: BigNumber;
        }[];
      }[];
      redemptionSetEvent: Event;
    };
  };

  // Iterate through all redemption statement on-chain. Sorting by block number to tackle oldest to most recent.
  for (const redemptionSetEvent of redemptionSetEvents.sort(
    (a, b) => a.blockNumber - b.blockNumber,
  )) {
    const { batchId: RedemptionSetEventBatchId, redemptionStatement } =
      redemptionSetEvent.args as unknown as {
        batchId: string;
        redemptionStatement: string;
      };
    // We will remove events that were used from certificateBatchMintedEvents array to speed up the process.
    const certificateBatchMintedEventIndexToFilter: number[] = [];

    const batchCertificates: {
      certificateId: BigNumber;
      value: BigNumber;
      mintEvent: Event;
      claims: {
        claimSingleEvent: Event;
        claimSubject: string;
        value: BigNumber;
      }[];
    }[] = [];
    // Loop through CertificateBatchMinted events, filtering when it concerns the current batch we are iterating over.
    for (const [
      certificateBatchMintedEventIndex,
      certificateBatchMintedEvent,
    ] of certificateBatchMintedEvents.entries()) {
      const { batchId: certificateBatchMintedEventBatchId, certificateIds } =
        certificateBatchMintedEvent.args as unknown as {
          batchId: string;
          certificateIds: BigNumber[];
        };
      // If this is the batch ID we are looking for, continue to construct data.
      if (RedemptionSetEventBatchId === certificateBatchMintedEventBatchId) {
        certificateBatchMintedEventIndexToFilter.push(
          certificateBatchMintedEventIndex,
        );
        // Iterate over all certificates IDs that are related to the current batch we are iterating over.
        for (const certificateId of certificateIds) {
          // We will remove events that were used from mintEvents array to speed up the process.
          const mintEventsIndexToFilter: number[] = [];
          // Looking for minting events concerning the certificate ID we are iterating over.
          for (const [mintEventIndex, mintEvent] of mintEvents.entries()) {
            const {
              id: mintEventCertificateId,
              value: mintedValue,
              to,
            } = mintEvent.args as unknown as {
              id: BigNumber;
              value: BigNumber;
              to: string;
            };
            if (mintEventCertificateId.eq(certificateId)) {
              // We will remove this mintEvent from our array.
              mintEventsIndexToFilter.push(mintEventIndex);
              // We will remove events that were used from claimSingleEvents array to speed up the process.
              const claimSingleEventsIndexToFilter: number[] = [];
              // Temporary buffer for claims related to certificate ID.
              const claims = [] as {
                claimSingleEvent: Event;
                claimSubject: string;
                value: BigNumber;
              }[];
              // Looking for claim events concerning the certificate ID we are iterating over.
              for (const [
                claimSingleEventIndex,
                claimSingleEvent,
              ] of claimSingleEvents.entries()) {
                const {
                  _id: claimSingleEventCertificateId,
                  _claimSubject: claimSubject,
                  _value: claimedValue,
                } = claimSingleEvent.args as unknown as {
                  _id: BigNumber;
                  _claimSubject: string;
                  _value: BigNumber;
                };
                if (claimSingleEventCertificateId.eq(certificateId)) {
                  claimSingleEventsIndexToFilter.push(claimSingleEventIndex);
                  claims.push({
                    claimSubject,
                    claimSingleEvent,
                    value: claimedValue,
                  });
                }
              }
              batchCertificates.push({
                certificateId,
                value: mintedValue,
                mintEvent,
                claims,
              });
              claimSingleEventsIndexToFilter.forEach(i =>
                claimSingleEvents.splice(i, 1),
              );
            }
          }
          mintEventsIndexToFilter.forEach(i => mintEvents.splice(i, 1));
        }
      }
    }
    // Remove "used" events to accelerate process down the line.
    certificateBatchMintedEventIndexToFilter.forEach(i =>
      certificateBatchMintedEvents.splice(i, 1),
    );

    batches[RedemptionSetEventBatchId] = {
      id: RedemptionSetEventBatchId,
      redemptionStatement,
      certificates: batchCertificates,
      redemptionSetEvent,
    };
  }

  // Generate all transaction objects that we'll need.
  const transactions = Object.values(batches).flatMap(b =>
    b.certificates.map(c => {
      return {
        tokenUri: b.redemptionStatement,
        amount: c.value.toString(),
        allocated: c.claims.map(cl => cl.claimSubject),
        allocations: c.claims.map(cl => cl.value.toString()),
        allocationsRedeemed: c.claims.map(() => true),
        rawArgs: [
          b.redemptionStatement,
          c.value.toString(),
          c.claims.map(cl => cl.claimSubject),
          c.claims.map(cl => cl.value.toString()),
          c.claims.map(() => true),
        ],
      };
    }),
  );
  console.log(transactions[transactions.length - 1]);

  server.listen(getPortEnv(), () => {
    console.info(`Server is running on port ${getPortEnv()}`);
  });
}

main().catch(console.error);
