import {
  getCurrentBlockHeight,
  getRecMarketplaceContractInstance,
  getRoleJsonKey,
} from '../utils/web3-utils';
import { EventType, PrismaClient } from '@prisma/client';

export const handleGrantRole = async (
  role: string,
  account: string,
  sender: string,
) => {
  // Get event metadata
  const blockHeight = await getCurrentBlockHeight();
  const recMarketplace = getRecMarketplaceContractInstance();

  // Fetch RoleGranted events from the chain, we will only handle one of them as it is most likely the one
  // we are looking for
  const roleGranted = await recMarketplace.queryFilter(
    recMarketplace.filters.RoleGranted(role, account, sender),
    blockHeight,
  );

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
        blockHeight: blockHeight.toString(),
        transactionHash: roleGranted[0].transactionHash,
        logIndex: roleGranted[0].logIndex,
      },
    })
    .catch(e => {
      console.log(e);
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
  // Get event metadata
  const blockHeight = await getCurrentBlockHeight();
  const recMarketplace = getRecMarketplaceContractInstance();

  // Fetch RoleRevoked events from the chain, we will only handle one of them as it is most likely the one
  // we are looking for
  const roleRevoked = await recMarketplace.queryFilter(
    recMarketplace.filters.RoleRevoked(role, account, sender),
    blockHeight,
  );

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
        [getRoleJsonKey(role)]: false,
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
        eventType: EventType.REVOKE_ROLE,
        data: {
          role,
          account,
          sender,
        },
        blockHeight: blockHeight.toString(),
        transactionHash: roleRevoked[0].transactionHash,
        logIndex: roleRevoked[0].logIndex,
      },
    })
    .catch(() => {
      console.log(
        `could not create GRANT_ROLE ${role} event for account: ${account}`,
      );
    });
};
