import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { BigNumber } from 'ethers';
import { useAccount, useContractRead, useContractReads } from 'wagmi';

import recMarketplace from '@/config/rec-marketplace';
import {
  FILTERED_LISTINGS,
  FILTERED_USERS,
  METADATA_BY_CID,
} from '@/lib/graphql';
import { BuyRecs } from '@/components/buy-recs-dialog';

function BuyRecsRow({
  listing: {
    collection: {
      filecoinTokenId,
      metadata: { cid, country, region, reportingStart, reportingEnd },
    },
    sellerAddress,
    amount,
    unitPrice,
  },
}) {
  return (
    <tr className="m-0 border-t border-slate-200 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {filecoinTokenId}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {country}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {region}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {reportingStart}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {reportingEnd}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {sellerAddress}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        <a
          className="underline hover:no-underline"
          href={`https://bafybeiepdrogejw7eji6qdbq3hpd3ewuuhecyvf4nyofvhntsbyb3w7tqa.on.fleek.co/#/explore/${cid.toString()}`}
          target="_blank"
          rel="noreferrer"
        >
          {cid.toString().substring(0, 14)}...
          {cid
            .toString()
            .substring(cid.toString().length - 14, cid.toString().length)}
        </a>
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {amount}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        <BuyRecs
          id={filecoinTokenId}
          seller={sellerAddress}
          price={unitPrice}
        />
      </td>
    </tr>
  );
}

export function BuyRecsTable() {
  const [isPolling, setIsPolling] = useState(false);

  const { loading, error, data, startPolling } = useQuery(FILTERED_LISTINGS, {
    variables: { where: { isSold: false } },
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    if (!isPolling && startPolling) {
      startPolling(5000);
      setIsPolling(true);
    }
  }, [startPolling, isPolling]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Couldn&apos;t fetch next REC id</p>;
  if (data.filteredListings.length === 0) return <p>No RECs in sale</p>;

  return (
    <table className="w-full">
      <thead>
        <tr className="m-0 border-t border-slate-300 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Id
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Country
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Region
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Reporting Start
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Reporting End
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Broker
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Cid
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Currently Listed
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        {data.filteredListings.map((l) => {
          return (
            <BuyRecsRow
              listing={l}
              key={`${l.sellerAddress}${l.collection.filecoinTokenId}`}
            />
          );
        })}
      </tbody>
    </table>
  );
}
