import { Chain, PrismaClient } from '@prisma/client';

const processEvents = async (fromBlock: number) => {};

export const seedEwcEvents = async () => {
  const prisma = new PrismaClient();

  const aggregate = await prisma.event
    .aggregate({
      _max: {
        id: true,
      },
      where: {
        chain: Chain.ENERGY_WEB,
      },
    })
    .catch((err: Error) =>
      console.error(`couldn't find highest id in Event table: ${err.message}`),
    );

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
        console.error(
          `couldn't find event data based on id ${aggregate?._max.id || ''}: ${
            err.message
          }`,
        ),
      );

    if (!latestHandledEvent) {
      throw new Error(
        `looking for an event of id ${
          aggregate?._max.id || ''
        } that does not exist`,
      );
    }

    fromBlock = latestHandledEvent.blockHeight;
  }

  await processEvents(parseInt(fromBlock, 10));
};
