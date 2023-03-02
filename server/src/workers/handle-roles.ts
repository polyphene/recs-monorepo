import { getRoleJsonKey } from '../utils/web3-utils';
import { PrismaClient } from '@prisma/client';

export const handleGrantRole = async (role: string, account: string) => {
  const prisma = new PrismaClient();

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
      console.log(
        `could not upsert addressRoles '${getRoleJsonKey(
          role,
        )}' to true for address: ${account}`,
      );
    });
};

export const handleRevokeRole = async (role: string, account: string) => {
  const prisma = new PrismaClient();

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
      },
    })
    .catch(() => {
      console.log(
        `could not upsert addressRoles '${getRoleJsonKey(
          role,
        )}' to false for address: ${account}`,
      );
    });
};
