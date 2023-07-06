import { getCurrentBlockHeight, getRecMarketplaceContractInstance, getRoleJsonKey } from '../utils/web3-utils';
import { EventType, PrismaClient } from '@prisma/client';

export const handleGrantRole = async (
    prisma: PrismaClient,
    blockHeight: number,
    transactionHash: string,
    logIndex: number,
    role: string,
    account: string,
    sender: string,
) => {
    await prisma.addressRoles
        .upsert({
            where: {
                address: account,
            },
            update: {
                [getRoleJsonKey(role)]: true,
            },
            create: {
                address: account,
                [getRoleJsonKey(role)]: true,
            },
        })
        .catch(() => {
            console.error(`could not upsert addressRoles '${getRoleJsonKey(role)}' to true for address: ${account}`);
        });

    const roleGrantedData = {
        tokenId: null,
        eventType: EventType.GRANT_ROLE,
        data: {
            role,
            account,
            sender,
        },
        blockHeight: blockHeight.toString(),
        transactionHash: transactionHash,
        logIndex: logIndex,
    };
    await prisma.event
        .upsert({
            where: {
                blockHeight_transactionHash_logIndex: {
                    blockHeight: blockHeight.toString(),
                    transactionHash: transactionHash,
                    logIndex: logIndex,
                },
            },
            update: roleGrantedData,
            create: roleGrantedData,
        })
        .catch(() => {
            console.error(`could not create GRANT_ROLE ${role} event for account: ${account}`);
        });
};

export const handleRevokeRole = async (
    prisma: PrismaClient,
    blockHeight: number,
    transactionHash: string,
    logIndex: number,
    role: string,
    account: string,
    sender: string,
) => {
    await prisma.addressRoles
        .upsert({
            where: {
                address: account,
            },
            update: {
                [getRoleJsonKey(role)]: false,
            },
            create: {
                address: account,
                [getRoleJsonKey(role)]: false,
            },
        })
        .catch(() => {
            console.error(`could not upsert addressRoles '${getRoleJsonKey(role)}' to true for address: ${account}`);
        });

    const roleRevokedData = {
        tokenId: null,
        eventType: EventType.REVOKE_ROLE,
        data: {
            role,
            account,
            sender,
        },
        blockHeight: blockHeight.toString(),
        transactionHash: transactionHash,
        logIndex: logIndex,
    };
    await prisma.event
        .upsert({
            where: {
                blockHeight_transactionHash_logIndex: {
                    blockHeight: blockHeight.toString(),
                    transactionHash: transactionHash,
                    logIndex: logIndex,
                },
            },
            update: roleRevokedData,
            create: roleRevokedData,
        })
        .catch(() => {
            console.error(`could not create GRANT_ROLE ${role} event for account: ${account}`);
        });
};
