/*
eslint {
  @typescript-eslint/no-unsafe-member-access: 0,
  @typescript-eslint/no-unsafe-assignment: 0,
  @typescript-eslint/no-unsafe-call: 0,
  @typescript-eslint/no-unsafe-return: 0
}
*/

import { PrismaClient, TransactionType } from '@prisma/client';
import { getEwfContractsInstances } from '../utils/web3-utils';
import { BigNumber, constants, Contract, Event } from 'ethers';
import type { Prisma } from '.prisma/client';
import path from 'path';
import fs from 'fs';
import Papa from 'papaparse';
import {
    AgreementMetadataCoder,
    ClaimDataCoder,
    IAgreementMetadata,
    IClaimData,
} from '@zero-labs/tokenization-contracts';
import { sprintf } from 'sprintf-js';
import { Metadata, store } from '../utils/storage';

/*
 * Energy Web Chain intersected data
 */

type Agreement = {
    agreementAddress: string;
    certificateIds: string[];
    signedAmount: string;
    filledAmount: string;
    buyer: string;
    seller: string;
    metadata: string;
    metadataDecoded: string;
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
    // Certificate ID that was subject of a claim.
    tokenId: string;
    // EW address.
    claimIssuer: string;
    // SP address that claimed the RECs.
    claimSubject: string;
    // ?
    topic: string;
    // Amount of RECs claimed.
    value: string;
    // Metadata associated to the claim.
    claimData: string;
    // Decoded claim data.
    claimDataDecoded: string;
    // Transaction hash at which the corresponding event was emitted.
    transactionHash: string;
    // Event of the Claim
    claimSingleEvent: Event;
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

type AgreementFilledArgs = {
    agreementAddress: string;
    certificateId: BigNumber;
    amount: BigNumber;
};

type AgreementSignedArgs = {
    agreementAddress: string;
    buyer: string;
    seller: string;
    amount: BigNumber;
};

type AgreementData = {
    buyer: string;
    seller: string;
    amount: BigNumber;
    metadata: string;
    valid: boolean;
};

type AgreementDataCached = AgreementData & {
    blockId: string;
    address: string;
    amount: string;
};

/*
 * Github data types
 */

type AllocationGithub = {
    allocation_id: string;
    UUID: string;
    contract_id: string;
    minerID: string;
    defaulted: number;
    allocation_cid: string;
    allocation_volume_MWh: number;
    productType: string;
    label: string | null;
    energySources: string;
    contractDate: number;
    deliveryDate: number;
    reportingStart: string;
    reportingEnd: string;
    sellerName: string;
    sellerAddress: string;
    country: string;
    region: string | null;
    contract_volume_MWh: number;
};

const AGREEMENTS_DATA_CACHE = path.resolve(__dirname, '../cache/agreements-data-cache.csv');

// eslint-disable-next-line @typescript-eslint/ban-types
const readCSV = async (filePath: string, stepCallback: Function): Promise<void> => {
    const csvFile = fs.readFileSync(filePath);
    const csvData = csvFile.toString();
    return new Promise(resolve => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        Papa.parse(csvData, {
            header: true,
            step: function (result: Papa.ParseStepResult<AgreementDataCached>) {
                stepCallback(result);
            },
            complete: results => {
                resolve();
            },
        });
    });
};

// getAgreementData fetches the metadata for the Agreements created on EWC. As this takes quite long we have a CSV-based
// cache system to speed up the process.
const getAgreementData = async (
    agreementFactoryContract: Contract,
    agreementSignedEvents: Array<Event>,
): Promise<{
    [p: string]: AgreementData;
}> => {
    const agreementsData: { [key: string]: AgreementData } = {};
    let latestBlockId = 0;
    const existingCache = fs.existsSync(AGREEMENTS_DATA_CACHE);

    if (existingCache) {
        await readCSV(AGREEMENTS_DATA_CACHE, function (result: Papa.ParseStepResult<AgreementDataCached>) {
            if (!result.data.valid) {
                return;
            }
            agreementsData[result.data.address] = {
                buyer: result.data.buyer,
                seller: result.data.seller,
                amount: BigNumber.from(result.data.amount),
                metadata: result.data.metadata,
                valid: result.data.valid,
            };

            if (parseInt(result.data.blockId, 10) > latestBlockId) {
                latestBlockId = parseInt(result.data.blockId, 10);
            }
        });
    }

    const stream = fs.createWriteStream(AGREEMENTS_DATA_CACHE, { flags: 'a' });

    if (!existingCache) {
        stream.write(`blockId,address,buyer,seller,amount,metadata,valid\n`);
    }

    // Iterate through all signed agreements to get metadata.
    for (const agreementSignedEvent of agreementSignedEvents.sort((a, b) => a.blockNumber - b.blockNumber)) {
        if (agreementSignedEvent.blockNumber <= latestBlockId) {
            continue;
        }

        const { agreementAddress } = agreementSignedEvent.args as unknown as AgreementSignedArgs;

        const agreementData: AgreementData = await agreementFactoryContract.agreementData(agreementAddress);

        agreementsData[agreementAddress] = {
            buyer: agreementData.buyer,
            seller: agreementData.seller,
            amount: agreementData.amount,
            metadata: agreementData.metadata,
            valid: agreementData.valid,
        };

        stream.write(
            `${agreementSignedEvent.blockNumber},${agreementAddress},${agreementData.buyer},${
                agreementData.seller
            },${agreementData.amount.toString()},${agreementData.metadata},${agreementData.valid ? 'true' : 'false'}\n`,
        );
    }

    stream.end();

    return agreementsData;
};

// filecoinF0ToEthAddress converts a f0.. formatted Filecoin address to an Ethereum address.
// Based on https://docs.filecoin.io/smart-contracts/filecoin-evm-runtime/address-types/#converting-to-a-0x-style-address
function filecoinF0ToEthAddress(filecoinAddress: string): string {
    const actorId = parseInt(filecoinAddress.slice(2)); // remove 'f0' prefix and get actor_id
    return sprintf('0xff0000000000000000000000%016x', actorId);
}

const processEvents = async (prisma: PrismaClient, fromBlock: number) => {
    const { registryExtendedContract, batchFactoryContract, agreementFactoryContract } = getEwfContractsInstances();

    // Fetch signed and filled agreements
    const agreementSignedEvents = await agreementFactoryContract.queryFilter(
        agreementFactoryContract.filters.AgreementSigned(),
        fromBlock,
    );

    const agreementFilledEvents = await agreementFactoryContract.queryFilter(
        agreementFactoryContract.filters.AgreementFilled(),
        fromBlock,
    );

    // Fetch agreement data on EWC
    const agreementsData = await getAgreementData(agreementFactoryContract, agreementSignedEvents);

    // Save latest block cached in DB
    const latestBlockHeight = agreementSignedEvents.sort((a, b) => a.blockNumber - b.blockNumber)[
        agreementSignedEvents.length - 1
    ].blockNumber;
    await prisma.utils
        .update({
            where: {
                id: 1,
            },
            data: {
                ewcBlockHeight: latestBlockHeight.toString(),
            },
        })
        .catch(() => {
            console.error(`could not find data utils`);
        });

    // Format all agreements
    const agreements: Agreement[] = [];
    const certificatesInAgreement: { [key: string]: boolean } = {}; // Used to not process useless certificates

    // Iterate through all signed agreements
    for (const agreementSignedEvent of agreementSignedEvents.sort((a, b) => a.blockNumber - b.blockNumber)) {
        const {
            agreementAddress: agreementSignedAddress,
            buyer,
            seller,
            amount: agreementSignedAmount,
        } = agreementSignedEvent.args as unknown as AgreementSignedArgs;

        const { metadata, valid } = agreementsData[agreementSignedAddress];

        if (!valid) {
            continue;
        }
        const certificateIds: string[] = [];
        let filledAmount: BigNumber = BigNumber.from(0);
        for (const agreementFilledEvent of agreementFilledEvents) {
            const {
                agreementAddress: agreementFilledAddress,
                certificateId,
                amount: agreementFilledAmount,
            } = agreementFilledEvent.args as unknown as AgreementFilledArgs;

            if (agreementSignedAddress === agreementFilledAddress) {
                certificatesInAgreement[certificateId.toString()] = true;
                certificateIds.push(certificateId.toString());
                filledAmount = filledAmount.add(agreementFilledAmount);
            }
        }
        agreements.push({
            agreementAddress: agreementSignedAddress,
            certificateIds,
            signedAmount: agreementSignedAmount.toString(),
            filledAmount: filledAmount.toString(),
            buyer,
            seller,
            metadata,
            metadataDecoded: JSON.stringify(AgreementMetadataCoder.decode(metadata)),
        });
    }

    console.info(`fetched ${agreements.length} agreements from EWC`);

    // Fetch EWC related events
    const mintEvents = await registryExtendedContract.queryFilter(
        registryExtendedContract.filters.TransferSingle(null, constants.AddressZero),
        fromBlock,
    );

    console.info(`fetched ${mintEvents.length} MINT events from EWC`);

    const redemptionSetEvents = await batchFactoryContract.queryFilter(
        batchFactoryContract.filters.RedemptionStatementSet(),
        fromBlock,
    );

    console.info(`fetched ${redemptionSetEvents.length} REDEMPTION_SET events from EWC`);

    const certificateBatchMintedEvents = await batchFactoryContract.queryFilter(
        batchFactoryContract.filters.CertificateBatchMinted(),
        fromBlock,
    );

    console.info(`fetched ${certificateBatchMintedEvents.length} BATCH_MINTED events from EWC`);

    const claimSingleEvents = await registryExtendedContract.queryFilter(
        registryExtendedContract.filters.ClaimSingle(),
        fromBlock,
    );

    console.info(`fetched ${claimSingleEvents.length} CLAIM events from EWC`);

    // Iterate through all redemption statement on-chain. Sorting by block number to tackle oldest to most recent.
    const claims: Claim[] = [];

    for (const redemptionSetEvent of redemptionSetEvents.sort((a, b) => a.blockNumber - b.blockNumber)) {
        const { batchId: redemptionSetEventBatchId } = redemptionSetEvent.args as unknown as RedemptionSetArgs;
        // Loop through CertificateBatchMinted events, filtering when it concerns the current batch we are iterating over.
        for (const certificateBatchMintedEvent of certificateBatchMintedEvents) {
            const { batchId: certificateBatchMintedEventBatchId, certificateIds } =
                certificateBatchMintedEvent.args as unknown as CertificateBatchMintedArgs;
            // If this is the batch ID we are looking for, continue to construct data.
            if (redemptionSetEventBatchId === certificateBatchMintedEventBatchId) {
                // Iterate over all certificates IDs that are related to the current batch we are iterating over.
                for (const certificateId of certificateIds) {
                    // If no agreement contains certificate then it does not concern us.
                    if (!certificatesInAgreement[certificateId.toString()]) {
                        continue;
                    }
                    // Looking for minting events concerning the certificate ID we are iterating over.
                    for (const mintEvent of mintEvents) {
                        const { id: mintEventCertificateId } = mintEvent.args as unknown as MintedArgs;

                        if (mintEventCertificateId.eq(certificateId)) {
                            // Looking for claim events concerning the certificate ID we are iterating over.
                            for (const claimSingleEvent of claimSingleEvents) {
                                const {
                                    _id: id,
                                    _claimSubject: claimSubject,
                                    _value: value,
                                    _claimIssuer: claimIssuer,
                                    _claimData: claimData,
                                    _topic: topic,
                                } = claimSingleEvent.args as unknown as ClaimSingleArgs;
                                if (id.eq(certificateId)) {
                                    const claimDataDecoded = ClaimDataCoder.decode(claimData);

                                    claims.push({
                                        tokenId: id.toString(),
                                        claimIssuer,
                                        claimSubject,
                                        topic: topic.toString(),
                                        value: value.toString(),
                                        claimData: claimData.toString(),
                                        claimDataDecoded: JSON.stringify(claimDataDecoded),
                                        transactionHash: claimSingleEvent.transactionHash,
                                        claimSingleEvent: claimSingleEvent,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    const frep = await import('@filecoin-renewable-energy-purchases/js-api/src/js/index.js');

    const renewableEnergyPurchases = new frep.RenewableEnergyPurchases();

    const certificatesGH: AllocationGithub[] = await renewableEnergyPurchases.getAllAllocationsFromGithub();

    const certificatesGHRegistry: { [key: string]: AllocationGithub } = {};

    certificatesGH.forEach(c => {
        certificatesGHRegistry[c.UUID] = c;
    });

    console.info(`fetched Filecoin Renewable Energy purchase`);

    const recMarketplaceDataRegistry: {
        [key: string]: {
            metadata: string;
            rawArgs: (string | string[] | boolean[])[];
            broker: string;
            ewcTokenIds: string[];
        };
    } = {};

    for (const a of agreements) {
        // Decode agreement metadata
        const agreementMetadata: IAgreementMetadata = JSON.parse(a.metadataDecoded);

        if (
            !Object.keys(recMarketplaceDataRegistry).includes(
                certificatesGHRegistry[agreementMetadata.agreementId].contract_id,
            )
        ) {
            const metadataToIPLD: Metadata = {
                contractId: certificatesGHRegistry[agreementMetadata.agreementId].contract_id,
                productType: certificatesGHRegistry[agreementMetadata.agreementId].productType,
                label: certificatesGHRegistry[agreementMetadata.agreementId].label || '',
                energySources: certificatesGHRegistry[agreementMetadata.agreementId].energySources,
                contractDate: certificatesGHRegistry[agreementMetadata.agreementId].contractDate.toString(),
                deliveryDate: certificatesGHRegistry[agreementMetadata.agreementId].deliveryDate.toString(),
                reportingStart: certificatesGHRegistry[agreementMetadata.agreementId].reportingStart,
                reportingEnd: certificatesGHRegistry[agreementMetadata.agreementId].reportingEnd,
                sellerName: certificatesGHRegistry[agreementMetadata.agreementId].sellerName,
                sellerAddress: certificatesGHRegistry[agreementMetadata.agreementId].sellerAddress,
                country: certificatesGHRegistry[agreementMetadata.agreementId].country,
                region: certificatesGHRegistry[agreementMetadata.agreementId].region || '',
                volume: certificatesGHRegistry[agreementMetadata.agreementId].contract_volume_MWh * 1000000,
            };

            const cid = await store(a.seller, [metadataToIPLD]);

            const rawArgs: (string | string[] | boolean[])[] = [
                cid,
                (certificatesGHRegistry[agreementMetadata.agreementId].contract_volume_MWh * 1000000).toString(),
                [],
                [],
                [],
            ];

            recMarketplaceDataRegistry[certificatesGHRegistry[agreementMetadata.agreementId].contract_id] = {
                broker: a.seller,
                rawArgs,
                metadata: JSON.stringify(metadataToIPLD),
                ewcTokenIds: [],
            };

            console.info(
                `prepared collection for bridging with CID: ${
                    recMarketplaceDataRegistry[certificatesGHRegistry[agreementMetadata.agreementId].contract_id]
                        .rawArgs[0] as string
                }`,
            );
        }

        for (const claim of claims) {
            const claimMetadata: IClaimData = JSON.parse(claim.claimDataDecoded);

            if (
                a.certificateIds.includes(claim.tokenId) &&
                a.agreementAddress === claim.claimIssuer &&
                a.buyer === claim.claimSubject
            ) {
                const beneficiary = claimMetadata.beneficiary.split(';')[1];

                (
                    recMarketplaceDataRegistry[certificatesGHRegistry[agreementMetadata.agreementId].contract_id]
                        .rawArgs[2] as string[]
                ).push(filecoinF0ToEthAddress(beneficiary));
                (
                    recMarketplaceDataRegistry[certificatesGHRegistry[agreementMetadata.agreementId].contract_id]
                        .rawArgs[3] as string[]
                ).push(claim.value);
                (
                    recMarketplaceDataRegistry[certificatesGHRegistry[agreementMetadata.agreementId].contract_id]
                        .rawArgs[4] as boolean[]
                ).push(true);
                if (
                    !recMarketplaceDataRegistry[
                        certificatesGHRegistry[agreementMetadata.agreementId].contract_id
                    ].ewcTokenIds.includes(claim.tokenId)
                ) {
                    recMarketplaceDataRegistry[
                        certificatesGHRegistry[agreementMetadata.agreementId].contract_id
                    ].ewcTokenIds.push(claim.tokenId);
                }
            }
        }
    }

    // Generate all transaction objects that we'll need.
    const transactions: Array<Prisma.TransactionCreateManyInput> = Object.values(recMarketplaceDataRegistry).map(d => {
        return {
            transactionType: TransactionType.MINT,
            rawArgs: d.rawArgs,
        };
    });

    const resTransactions = await prisma.transaction
        .createMany({
            data: transactions,
            skipDuplicates: true,
        })
        .catch(() => {
            console.error(`could not create transactions document`);
        });
    if (!resTransactions) {
        throw new Error(`could not process Energy Web Chain data into bridge transactions`);
    }

    console.info(`created ${resTransactions.count} transactions object in the database`);

    // Generate all transaction objects that we'll need.
    const metadatas: Array<Prisma.MetadataCreateManyInput> = Object.values(recMarketplaceDataRegistry).map(d => {
        const metadata: Metadata = JSON.parse(d.metadata);
        return {
            cid: d.rawArgs[0] as string,
            contractId: metadata.contractId,
            productType: metadata.productType,
            label: metadata.label,
            energySources: metadata.energySources,
            contractDate: metadata.contractDate,
            deliveryDate: metadata.deliveryDate,
            reportingStart: metadata.reportingStart,
            reportingEnd: metadata.reportingEnd,
            sellerName: metadata.sellerName,
            sellerAddress: metadata.sellerAddress,
            country: metadata.country,
            region: metadata.region,
            volume: metadata.volume.toString(),
            createdBy: d.broker,
            minted: false,
        };
    });

    const resMetadatas = await prisma.$transaction(metadatas.map(m => prisma.metadata.create({ data: m })));
    if (resMetadatas.length === 0 && metadatas.length > 0) {
        throw new Error(`could not process Energy Web Chain data into bridge transactions`);
    }

    console.info(`created ${resMetadatas.length} transactions object in the database`);

    // Generate all transaction objects that we'll need.
    const collections: Array<Prisma.CollectionCreateInput> = Object.values(recMarketplaceDataRegistry).map(d => {
        return {
            energyWebTokenIds: d.ewcTokenIds,
            metadata: {
                connect: {
                    id: resMetadatas.filter(m => {
                        return m.cid === d.rawArgs[0];
                    })[0].id,
                },
            },
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
        throw Error('Utils table should be properly initialize before seeding data from EWC');
    }

    await processEvents(prisma, utils ? parseInt(utils.ewcBlockHeight, 10) + 1 : 1);
};
