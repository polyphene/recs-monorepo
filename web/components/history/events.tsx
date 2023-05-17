import { ApolloError, useQuery } from '@apollo/client';

import {
  EVENTS_BY_TOKEN_ID,
  FILTERED_COLLECTIONS,
  METADATA_BY_CID,
} from '@/lib/graphql';

type Event = {
  id: number;
  chain: string;
  tokenId: string;
  eventType: string;
  data:
    | RoleEventData
    | TransferEventData
    | ListEventData
    | BuyEventData
    | RedeemEventData
    | EwcRedemptionSetEventData
    | EwcClaimEventData;
  blockHeight: string;
  transactionHash: string;
  logIndex: string;
  createdAt: string;
};

type RoleEventData = {
  role: string;
  sender: string;
  account: string;
};

type TransferEventData = {
  id: string;
  from: string;
  to: string;
  value: string;
  operator: string;
};

type ListEventData = {
  tokenId: string;
  seller: string;
  tokenAmount: string;
  price: string;
};

type BuyEventData = {
  buyer: string;
  price: string;
  seller: string;
  tokenId: string;
  tokenAmount: string;
};

type RedeemEventData = {
  owner: string;
  amount: string;
  tokenId: string;
};

type EwcRedemptionSetEventData = {
  batchId: string;
  redemptionStatement: string;
  storagePointer: string;
};

type EwcClaimEventData = {
  _claimIssuer: string;
  _claimSubject: string;
  _topic: string;
  _id: string;
  _value: string;
  _claimData: string;
};

function EventsRow({ event }: { event: Event }) {
  console.log(event);
  return (
    <tr className="m-0 border-t border-slate-200 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {event.eventType.charAt(0).toUpperCase() +
          event.eventType.slice(1).toLowerCase()}{' '}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        <a
          className="underline hover:no-underline"
          href={
            event.chain === 'ENERGY_WEB'
              ? `https://explorer.energyweb.org/tx/${event.transactionHash}`
              : `https://hyperspace.filfox.info/en/message/${event.transactionHash}`
          }
          target="_blank"
          rel="noreferrer"
        >
          {event.transactionHash.substring(0, 5)}...
          {event.transactionHash.substring(
            event.transactionHash.length - 5,
            event.transactionHash.length
          )}
        </a>
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {Object.entries(event.data).map(([key, value]) => {
          if (key === '__typename' || key === 'tokenId') return <></>;
          return (
            <p>
              {key}: {value}
            </p>
          );
        })}
      </td>
    </tr>
  );
}

export function EventsTable({
  tokenId,
  chain,
}: {
  tokenId: string;
  chain: string;
}) {
  let {
    data,
    loading,
    error,
  }: {
    data: { filteredCollections: Array<{ events: Array<Event> }> };
    loading: boolean;
    error?: ApolloError;
  } = useQuery(FILTERED_COLLECTIONS, {
    variables: {
      where: {
        filecoinTokenId: chain === 'filecoin' ? tokenId : null,
        energyWebTokenId: chain === 'ewc' ? tokenId : null,
      },
    },
  });

  if (tokenId.length === 0 || chain.length === 0) {
    return <p>Please select a chain and specify a token Id</p>;
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Couldn&apos;t fetch events for token ID {tokenId}</p>;
  if (data.filteredCollections.length === 0)
    return <p>No events for token ID {tokenId}</p>;

  return (
    <table className="w-full">
      <thead>
        <tr className="m-0 border-t border-slate-300 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Event
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Transaction
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Data
          </th>
        </tr>
      </thead>
      <tbody>
        {data.filteredCollections[0].events
          .slice()
          .filter((e) => e.eventType !== 'TRANSFER')
          .sort((a, b) => {
            return (
              parseInt(a.blockHeight) +
              parseInt(a.logIndex) -
              parseInt(b.blockHeight) -
              parseInt(b.logIndex)
            );
          })
          .map((e) => {
            return (
              <EventsRow
                event={e}
                key={`${e.blockHeight}${e.transactionHash}${e.logIndex}`}
              />
            );
          })}
      </tbody>
    </table>
  );
}
