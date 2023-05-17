import { Chain, EventType, PrismaClient, TransactionType } from '@prisma/client';
import { decodeClaimV1, decodeClaimV2, decodeClaimV3, getEwfContractsInstances } from '../utils/web3-utils';
import { BigNumber, constants, Event } from 'ethers';
import type { Prisma, Event as PrismaEvent } from '.prisma/client';

/*
 * Energy Web Chain intersected data
 */

type CertificateRegistry = {
    [key: string]: Certificate;
};

type Batch = {
    id: string;
    redemptionStatement: string;
    certificates: Certificate[];
    redemptionSetEvent: Event;
};

type Certificate = {
    certificateId: BigNumber;
    broker: string;
    value: BigNumber;
    mintEvent: Event;
    claims: Claim[];
    // TODO when metadata can be handled, pass cid here
    //metadataCid: CIDString;
};

type Claim = {
    claimSingleEvent: Event;
    claimSubject: string;
    value: BigNumber;
};

/*
 * Energy Web Chain events args
 */

type CertificateBatchMintedArgs = {
    batchId: string;
    certificateIds: BigNumber[];
};

type RedemptionSetArgs = {
    batchId: string;
    redemptionStatement: string;
    storagePointer: string;
};

type MintedArgs = {
    id: BigNumber;
    value: BigNumber;
    operator: string;
    from: string;
    to: string;
};

type ClaimSingleArgs = {
    _claimIssuer: string;
    _claimSubject: string;
    _topic: BigNumber;
    _id: BigNumber;
    _value: BigNumber;
    _claimData: string;
};

const processEvents = async (prisma: PrismaClient, fromBlock: number) => {
    const { registryExtendedContract, batchFactoryContract } = getEwfContractsInstances();

    // Retrieve mint events and store them in the database
    const mintEvents = await registryExtendedContract.queryFilter(
        registryExtendedContract.filters.TransferSingle(null, constants.AddressZero),
        fromBlock,
    );
    const dbMintEventInputs: Array<Prisma.EventCreateInput> = mintEvents.map(e => {
        return {
            tokenId: (e.args as unknown as MintedArgs).id.toString(),
            chain: Chain.ENERGY_WEB,
            eventType: EventType.MINT,
            data: {
                id: (e.args as unknown as MintedArgs).id.toString(),
                value: (e.args as unknown as MintedArgs).value.toString(),
                operator: (e.args as unknown as MintedArgs).operator,
                from: (e.args as unknown as MintedArgs).from,
                to: (e.args as unknown as MintedArgs).to,
            } as Prisma.InputJsonObject,
            blockHeight: e.blockNumber.toString(),
            transactionHash: e.transactionHash,
            logIndex: e.logIndex,
        };
    });

    console.info(`fetched ${dbMintEventInputs.length} MINT events from EWC`);

    // Fetch redemption set and certificate batch minted events, then store redemption set in db
    const redemptionSetEvents = await batchFactoryContract.queryFilter(
        batchFactoryContract.filters.RedemptionStatementSet(),
        fromBlock,
    );
    const certificateBatchMintedEvents = await batchFactoryContract.queryFilter(
        batchFactoryContract.filters.CertificateBatchMinted(),
        fromBlock,
    );
    console.info(`fetched ${redemptionSetEvents.length} REDEMPTION_SET events from EWC`);

    const dbRedemptionEventInputs: Array<Prisma.EventCreateInput> = redemptionSetEvents.flatMap(e => {
        const certificateIds = certificateBatchMintedEvents.flatMap(cbme => {
            if (
                (e.args as unknown as RedemptionSetArgs).batchId ===
                (cbme.args as unknown as CertificateBatchMintedArgs).batchId
            ) {
                return (cbme.args as unknown as CertificateBatchMintedArgs).certificateIds;
            }
            return [];
        });
        return certificateIds.map((id, i) => {
            return {
                tokenId: id.toString(),
                chain: Chain.ENERGY_WEB,
                eventType: EventType.REDEMPTION_SET,
                data: {
                    batchId: (e.args as unknown as RedemptionSetArgs).batchId,
                    redemptionStatement: (e.args as unknown as RedemptionSetArgs).redemptionStatement,
                    storagePointer: (e.args as unknown as RedemptionSetArgs).storagePointer,
                } as Prisma.InputJsonObject,
                blockHeight: e.blockNumber.toString(),
                transactionHash: e.transactionHash,
                // TODO, this is wrong but as we set redemption statement ace for everything this is the only way to ensure that we conserve proper db
                logIndex: e.logIndex + i,
            };
        });
    });

    //Fetch claim events and store them
    const claimSingleEvents = await registryExtendedContract.queryFilter(
        registryExtendedContract.filters.ClaimSingle(),
        fromBlock,
    );
    const dbClaimEventInputs: Array<Prisma.EventCreateInput> = claimSingleEvents.map(e => {
        return {
            tokenId: (e.args as unknown as ClaimSingleArgs)._id.toString(),
            chain: Chain.ENERGY_WEB,
            eventType: EventType.CLAIM,
            data: {
                _claimIssuer: (e.args as unknown as ClaimSingleArgs)._claimIssuer,
                _claimSubject: (e.args as unknown as ClaimSingleArgs)._claimSubject,
                _topic: (e.args as unknown as ClaimSingleArgs)._topic.toString(),
                _id: (e.args as unknown as ClaimSingleArgs)._id.toString(),
                _value: (e.args as unknown as ClaimSingleArgs)._value.toString(),
                _claimData: (e.args as unknown as ClaimSingleArgs)._claimData,
            },
            blockHeight: e.blockNumber.toString(),
            transactionHash: e.transactionHash,
            logIndex: e.logIndex,
        };
    });

    console.info(`fetched ${claimSingleEvents.length} CLAIM events from EWC`);

    const dbEventInputs = [...dbMintEventInputs, ...dbRedemptionEventInputs, ...dbClaimEventInputs].sort(
        (a, b) => parseInt(a.blockHeight, 10) - parseInt(b.blockHeight, 1),
    );

    if (dbEventInputs.length === 0) {
        console.info('no new EWC events to store in the database');
        return;
    }

    const dbEvents: PrismaEvent[] = [];

    const moduloQuarter = (dbEventInputs.length - 1) % 4;
    const quarterSize = (dbEventInputs.length - 1 - moduloQuarter) / 4;
    for (const quarterPosition of [1, 2, 3, 4]) {
        const startIndex = (quarterPosition - 1) * quarterSize;
        const endIndex =
            quarterPosition === 4 ? quarterPosition * quarterSize + moduloQuarter : quarterPosition * quarterSize;

        for (const data of dbEventInputs.slice(startIndex, endIndex)) {
            dbEvents.push(
                await prisma.event.create({
                    data,
                }),
            );
        }
    }

    const latestEvent = await prisma.event.create({
        data: dbEventInputs.slice(dbEventInputs.length - 1)[0],
    });

    dbEvents.push(latestEvent);

    console.info(`created a total of ${dbEvents.length} events object from EWC in the database`);

    const certificates: CertificateRegistry = {} as CertificateRegistry;
    // Loop through CertificateBatchMinted events, filtering when it concerns the current batch we are iterating over.
    // TODO when we can actually get certificate, set metadata
    for (const certificateBatchMintedEvent of certificateBatchMintedEvents) {
        // Get CertificateBatchMinted args.
        const { certificateIds } = certificateBatchMintedEvent.args as unknown as CertificateBatchMintedArgs;
        // Iterate over all certificates IDs that are related to the current batch we are iterating over.
        for (const certificateId of certificateIds) {
            // Looking for minting events concerning the certificate ID we are iterating over.
            for (const mintEvent of mintEvents) {
                const { id: mintEventCertificateId, value: mintedValue, to } = mintEvent.args as unknown as MintedArgs;

                if (mintEventCertificateId.eq(certificateId)) {
                    // Temporary buffer for claims related to certificate ID.
                    const claims = [] as Claim[];
                    // Looking for claim events concerning the certificate ID we are iterating over.
                    for (const claimSingleEvent of claimSingleEvents) {
                        const {
                            _id: claimSingleEventCertificateId,
                            _claimSubject: claimSubject,
                            _value: claimedValue,
                            _claimData: claimData,
                        } = claimSingleEvent.args as unknown as ClaimSingleArgs;
                        if (claimSingleEventCertificateId.eq(certificateId)) {
                            let claimDataDecoded = decodeClaimV3(claimData);
                            if (!claimDataDecoded) {
                                claimDataDecoded = decodeClaimV1(claimData);
                            }
                            if (!claimDataDecoded) {
                                claimDataDecoded = decodeClaimV2(claimData);
                            }

                            claims.push({
                                claimSubject,
                                claimSingleEvent,
                                value: claimedValue,
                            });
                        }
                    }
                    certificates[certificateId.toString()] = {
                        certificateId,
                        broker: to,
                        value: mintedValue,
                        mintEvent,
                        claims,
                    };
                }
            }
        }
    }

    // Generate all transaction objects that we'll need.
    const transactions: Array<Prisma.TransactionCreateManyInput> = Object.values(certificates).map(c => {
        return {
            transactionType: TransactionType.MINT,
            rawArgs: [
                'ewc-things',
                c.value.toString(),
                c.claims.map(cl => cl.claimSubject),
                c.claims.map(cl => cl.value.toString()),
                c.claims.map(() => true),
            ],
        };
    });

    const res = await prisma.transaction
        .createMany({
            data: transactions,
            skipDuplicates: true,
        })
        .catch(() => {
            console.error(`could not create transactions document`);
        });
    if (!res) {
        throw new Error(`could not process Energy Web Chain data into bridge transactions`);
    }

    console.info(`created ${res.count} transactions object in the database`);

    // Generate all transaction objects that we'll need.
    const collections: Array<Prisma.CollectionCreateInput> = Object.values(certificates).map(c => {
        return {
            energyWebTokenId: c.certificateId.toString(),
            events: {
                connect: dbEvents
                    .filter(dbe => {
                        return dbe.tokenId === c.certificateId.toString();
                    })
                    .map(dbe => {
                        return {
                            id: dbe.id,
                        };
                    }),
            },
            //TODO for now we generate all without metadata as we can not parse them from EWC anyway
        };
    });

    let count = 0;
    for (const collection of collections) {
        const res = await prisma.collection
            .create({
                data: collection,
            })
            .catch((err: Error) => console.error(`Could not create collection document: ${err.message}`));
        if (!res) {
            throw new Error(`could not process Energy Web Chain data into collection table`);
        }

        count++;
    }

    console.info(`created ${count} collections object in the database`);
};

export const seedEwcData = async (prisma: PrismaClient) => {
    const aggregate = await prisma.event
        .aggregate({
            _max: {
                id: true,
            },
            where: {
                chain: Chain.ENERGY_WEB,
            },
        })
        .catch((err: Error) => console.error(`couldn't find highest id in Event table: ${err.message}`));

    // Initialize block to start off at chain initialization
    let fromBlock = '0';

    // If we have a valid Id of an event start of it
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (aggregate?._max.id) {
        const latestHandledEvent = await prisma.event
            .findUnique({
                where: {
                    id: aggregate._max.id,
                },
            })
            .catch((err: Error) =>
                console.error(`couldn't find event data based on id ${aggregate?._max.id || ''}: ${err.message}`),
            );

        if (!latestHandledEvent) {
            throw new Error(`looking for an event of id ${aggregate?._max.id || ''} that does not exist`);
        }

        fromBlock = latestHandledEvent.blockHeight;
    }

    await processEvents(prisma, parseInt(fromBlock, 10) + 1);
};
