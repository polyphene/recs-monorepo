import { getRoleJsonKey } from '../utils/web3-utils';
import { EventType, PrismaClient } from '@prisma/client';

export const handleGrantRole = async (
  role: string,
  account: string,
  sender: string,
) => {
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

  await prisma.event
    .create({
      data: {
        tokenId: null,
        // Disabling eslint rule which poses problem at assignment (prisma issue here)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        eventType: EventType.GRANT_ROLE,
        data: {
          role,
          account,
          sender,
        },
        blockHeight: '0',
      },
    })
    .catch(() => {
      console.log(
        `could not create GRANT_ROLE ${role} event for account: ${account}`,
      );
    });
};

export const handleRevokeRole = async (
  role: string,
  account: string,
  sender: string,
) => {
  const prisma = new PrismaClient();

  await prisma.event
    .create({
      data: {
        tokenId: null,
        // Disabling eslint rule which poses problem at assignment (prisma issue here)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        eventType: EventType.REVOKE_ROLE,
        data: {
          role,
          account,
          sender,
        },
        blockHeight: '0',
      },
    })
    .catch(() => {
      console.log(
        `could not create GRANT_ROLE ${role} event for account: ${account}`,
      );
    });
};
