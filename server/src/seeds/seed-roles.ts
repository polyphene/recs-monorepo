import { AUDITOR_ROLE, getRecMarketplaceContractInstance, getRoleJsonKey } from '../utils/web3-utils';
import { isObjKey } from '../utils';
import { EventType, PrismaClient } from '@prisma/client';
import { getDeploymentBlockHeightEnv } from '../utils/env';
import { Event } from '@ethersproject/contracts';

type AccountRolesDictionary = {
    [key: string]: {
        address: string;
        isAdmin: boolean;
        isMinter: boolean;
        isRedeemer: boolean;
    };
};

const seedRoles = async (prisma: PrismaClient, fromBlock: number) => {
    const recMarketplace = getRecMarketplaceContractInstance();

    // Fetch RoleGranted events from the chain
    const roleGrantedEvents = await recMarketplace
        .queryFilter(recMarketplace.filters.RoleGranted(), fromBlock)
        .catch((err: Error) => {
            console.error(`Error while fetching Role Granted events: ${err.message}`);
            return [] as Event[];
        });

    // Fetch RoleRevoked events from the chain
    const roleRevokedEvents = await recMarketplace
        .queryFilter(recMarketplace.filters.RoleRevoked(), fromBlock)
        .catch((err: Error) => {
            console.error(`Error while fetching Role Revoked events: ${err.message}`);
            return [] as Event[];
        });

    if (roleGrantedEvents.length === 0 && roleRevokedEvents.length === 0) {
        return;
    }

    // Merging the events returned
    const events = [...roleGrantedEvents, ...roleRevokedEvents].sort(
        (a, b) => a.blockNumber + a.logIndex - b.blockNumber - b.logIndex,
    );

    // Iterate over events, generate document in DB and the new AddressRoles state
    const accountRoles: AccountRolesDictionary = {};
    const handledEvents: string[] = [];
    for (const e of events) {
        if (!e.args) {
            throw new Error('event in the list have no args');
        }

        const uniqueEventId = e.blockNumber.toString() + e.transactionHash + e.logIndex.toString();

        if (handledEvents.includes(uniqueEventId)) {
            continue;
        }

        const fetchedEvent = await prisma.event.findFirst({
            where: {
                blockHeight: e.blockNumber.toString(),
                transactionHash: e.transactionHash,
                logIndex: e.logIndex,
            },
        });

        if (fetchedEvent !== null) {
            return;
        }

        const { account, role, sender } = e.args as unknown as {
            account: string;
            role: string;
            sender: string;
        };

        // We do not handle auditor role for now
        if (role === AUDITOR_ROLE) {
            continue;
        }

        console.info(`event ${e.event ?? 'noEvent'} at block ${e.blockNumber} w/ block hash ${e.blockHash}`);

        const eventType = e.event !== 'RoleRevoked' ? EventType.GRANT_ROLE : EventType.REVOKE_ROLE;

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
                    transactionHash: e.transactionHash,
                    logIndex: e.logIndex,
                },
            })
            .catch(() => {
                console.error(`could not create ${eventType} ${role} event for account: ${account}`);
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

        handledEvents.push(uniqueEventId);
    }

    // For each AddressRole run upsert
    await Promise.all(
        Object.values(accountRoles).map(a =>
            prisma.user
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
                .catch(() => console.error(`could not upsert data for address ${a.address}`)),
        ),
    );

    console.info('successfully seeded roles database!');
};

export const constructRolesTable = async (prisma: PrismaClient) => {
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

    await seedRoles(prisma, parseInt(utils.filecoinBlockHeight, 10) + 1).catch((err: Error) => {
        console.error(`error when seeding roles from block ${utils.filecoinBlockHeight}: ${err.message}`);
    });
};
