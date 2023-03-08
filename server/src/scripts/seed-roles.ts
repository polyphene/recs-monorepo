import {
  AUDITOR_ROLE,
  getRecMarketplaceContractInstance,
  getRoleJsonKey,
  initRoles,
} from '../utils/web3-utils';
import { isObjKey } from '../utils';
import { EventType, PrismaClient } from '@prisma/client';

type AccountRolesDictionary = {
  [key: string]: {
    address: string;
    isAdmin: boolean;
    isMinter: boolean;
    isRedeemer: boolean;
  };
};

const seedRoles = async (fromBlock: number) => {
  const recMarketplace = getRecMarketplaceContractInstance();

  // Fetch RoleGranted events from the chain
  const roleGrantedEvents = await recMarketplace.queryFilter(
    recMarketplace.filters.RoleGranted(),
    fromBlock,
  );
  console.log(roleGrantedEvents.length);

  // Fetch RoleRevoked events from the chain
  const roleRevokedEvents = await recMarketplace.queryFilter(
    recMarketplace.filters.RoleRevoked(),
    fromBlock,
  );
  console.log(roleRevokedEvents.length);

  // Merging the events returned
  const events = [...roleGrantedEvents, ...roleRevokedEvents].sort(
    (a, b) => a.blockNumber + a.logIndex - b.blockNumber - b.logIndex,
  );
  console.log(events.length);

  events.forEach(e => {
    console.log(e.blockNumber, e.transactionHash, e.logIndex);
  });
  return;
  // Init roles value based on on-chain data
  await initRoles();

  const prisma = new PrismaClient();

  // Iterate over events, generate document in DB and the new AddressRoles state
  const accountRoles: AccountRolesDictionary = {};
  events.forEach(e => {
    console.log(
      `event ${e.event ?? 'noEvent'} at block ${e.blockNumber} w/ block hash ${
        e.blockHash
      }`,
    );
    if (!e.args) {
      throw new Error('event in the list have no args');
    }

    const { account, role, sender } = e.args as unknown as {
      account: string;
      role: string;
      sender: string;
    };

    // We do not handle auditor role for now
    if (role === AUDITOR_ROLE) {
      return;
    }

    const eventType =
      e.event !== 'RoleRevoked' ? EventType.GRANT_ROLE : EventType.REVOKE_ROLE;

    prisma.event
      .create({
        data: {
          tokenId: null,
          // Disabling eslint rule which poses problem at assignment (prisma issue here)
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
          eventType: eventType,
          data: {
            role,
            account,
            sender,
          },
          blockHeight: e.blockNumber.toString(),
        },
      })
      .catch(() => {
        console.log(
          `could not create ${eventType} ${role} event for account: ${account}`,
        );
      });

    if (!isObjKey(account, accountRoles)) {
      accountRoles[account] = {
        address: account,
        isAdmin: false,
        isMinter: false,
        isRedeemer: false,
      };
    }

    accountRoles[account][getRoleJsonKey(role)] = e.event !== 'RoleRevoked';
  });

  // For each AddressRole run upsert
  await Promise.all(
    Object.values(accountRoles).map(a =>
      prisma.addressRoles
        .upsert({
          where: {
            address: a.address,
          },
          update: {
            isAdmin: a.isAdmin,
            isMinter: a.isMinter,
            isRedeemer: a.isRedeemer,
          },
          create: a,
        })
        .catch(() =>
          console.log(`could not upsert data for address ${a.address}`),
        ),
    ),
  );

  console.log('successfully seeded roles database!');
};
//89916
seedRoles(147041).then(console.log).catch(console.log);
