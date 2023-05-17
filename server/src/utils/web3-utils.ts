import {
    getBatchFactoryAddressEnv,
    getEthHttpUriEnv,
    getEwfHttpUriEnv,
    getRecMarketplaceAddressEnv,
    getRegistryExtendedAddressEnv,
} from '../utils/env';
import { BytesLike, ethers } from 'ethers';
import recMarketplaceConfig from '../config/rec-marketplace';
import registryExtendedConfig from '../config/registry-extended';
import batchFactoryConfig from '../config/batch-factory';
import { defaultAbiCoder } from 'ethers/lib/utils';

export const getRecMarketplaceContractInstance = () => {
    const recMarketplaceAddress = getRecMarketplaceAddressEnv();
    const ethProvider = ethers.getDefaultProvider(getEthHttpUriEnv());

    return new ethers.Contract(recMarketplaceAddress, recMarketplaceConfig.abi, ethProvider);
};

export const getEwfContractsInstances = () => {
    const registryExtendedAddress = getRegistryExtendedAddressEnv();
    const batchFactoryAddress = getBatchFactoryAddressEnv();
    const ewfProvider = ethers.getDefaultProvider(getEwfHttpUriEnv());

    return {
        registryExtendedContract: new ethers.Contract(registryExtendedAddress, registryExtendedConfig.abi, ewfProvider),
        batchFactoryContract: new ethers.Contract(batchFactoryAddress, batchFactoryConfig.abi, ewfProvider),
    };
};

export const getCurrentBlockHeight = () => {
    const ethProvider = ethers.getDefaultProvider(getEthHttpUriEnv());

    return ethProvider.getBlockNumber();
};

export let ADMIN_ROLE = '';
export let REDEEMER_ROLE = '';
export let MINTER_ROLE = '';
export let AUDITOR_ROLE = '';

export const getRoleJsonKey = (role: string) => {
    switch (role) {
        case ADMIN_ROLE:
            return 'isAdmin';
        case REDEEMER_ROLE:
            return 'isRedeemer';
        case MINTER_ROLE:
            return 'isMinter';
        default:
            throw Error('trying to get json key for unknown role');
    }
};

// Initialize roles ids based on contract
export const initRoles = async () => {
    if (ADMIN_ROLE || REDEEMER_ROLE || MINTER_ROLE || AUDITOR_ROLE) {
        throw new Error('calling initRoles function more than once');
    }

    const recMarketplace = getRecMarketplaceContractInstance();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
    ADMIN_ROLE = await recMarketplace.DEFAULT_ADMIN_ROLE();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
    MINTER_ROLE = await recMarketplace.MINTER_ROLE();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
    REDEEMER_ROLE = await recMarketplace.REDEEMER_ROLE();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
    AUDITOR_ROLE = await recMarketplace.AUDITOR_ROLE();
};

/*****************************************
 * EWC utils
 *****************************************/

export type ClaimData = {
    beneficiary: string;
    region: string;
    countryCode: string;
    periodStartDate: string;
    periodEndDate: string;
    purpose: string;
    consumptionEntityID: string;
    proofID: string;
    location: string;
};

// Sourced from EW repository: https://github.com/energywebfoundation/origin/blob/dc4930d80d4703d22beee27acac42db9157e27c1/packages/traceability/issuer/src/blockchain-facade/CertificateUtils.ts#L43-L68
export const decodeClaimV1 = (data: BytesLike): ClaimData | null => {
    try {
        const [beneficiary, location, countryCode, periodStartDate, periodEndDate, purpose]: ReadonlyArray<string> =
            defaultAbiCoder.decode(['string', 'string', 'string', 'string', 'string', 'string'], data);

        // If any field is undefined it means that we are not decoding over the proper data structure, so returning null
        if (
            beneficiary === undefined ||
            location === undefined ||
            countryCode === undefined ||
            periodStartDate === undefined ||
            periodEndDate === undefined ||
            purpose === undefined
        ) {
            return null;
        }

        return {
            beneficiary,
            region: '',
            countryCode,
            periodStartDate,
            periodEndDate,
            purpose,
            consumptionEntityID: '',
            proofID: '',
            location,
        };
    } catch {
        return null;
    }
};

// Sourced from EW repository: https://github.com/energywebfoundation/origin/blob/dc4930d80d4703d22beee27acac42db9157e27c1/packages/traceability/issuer/src/blockchain-facade/CertificateUtils.ts#L43-L68
export const decodeClaimV2 = (data: BytesLike): ClaimData | null => {
    try {
        const [claimData]: ReadonlyArray<string> = defaultAbiCoder.decode(['string'], data);

        return JSON.parse(claimData) as ClaimData;
    } catch {
        return null;
    }
};

// Sourced from messages sent to Moca
export const decodeClaimV3 = (data: BytesLike): ClaimData | null => {
    try {
        const [
            beneficiary,
            region,
            countryCode,
            periodStartDate,
            periodEndDate,
            purpose,
            consumptionEntityID,
            proofID,
        ]: ReadonlyArray<string> = defaultAbiCoder.decode(
            ['string', 'string', 'string', 'string', 'string', 'string', 'string', 'string'],
            data,
        );

        if (
            beneficiary === undefined ||
            region === undefined ||
            countryCode === undefined ||
            periodStartDate === undefined ||
            periodEndDate === undefined ||
            purpose === undefined ||
            consumptionEntityID === undefined ||
            proofID === undefined
        ) {
            return null;
        }

        return {
            beneficiary,
            region,
            countryCode,
            periodStartDate,
            periodEndDate,
            purpose,
            consumptionEntityID,
            proofID,
            location: '',
        };
    } catch {
        return null;
    }
};
