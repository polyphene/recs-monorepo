import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { useAccount } from 'wagmi';

import { FILTERED_METADATA } from '@/lib/graphql';
import { MintRECs } from '@/components/mint-recs-dialog';

function PendingRecsRow({
  metadata: {
    cid,
    country,
    region,
    reportingStart,
    reportingEnd,
    energySources,
    volume,
  },
}) {
  return (
    <tr className="m-0 border-t border-slate-200 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        <div className="flex items-center">
          <a
            className="underline hover:no-underline"
            href={`https://bafybeiepdrogejw7eji6qdbq3hpd3ewuuhecyvf4nyofvhntsbyb3w7tqa.on.fleek.co/#/explore/${cid}`}
            target="_blank"
            rel="noreferrer"
          >
            {cid.substring(0, 14)}...
            {cid.substring(cid.length - 14, cid.length)}
          </a>
        </div>
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
        {energySources}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {volume}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        <MintRECs cid={cid} volume={volume} />
      </td>
    </tr>
  );
}

export function PendingRecsTable() {
  const { address } = useAccount();
  const [isPolling, setIsPolling] = useState(false);
  const { loading, error, data, startPolling } = useQuery(FILTERED_METADATA, {
    variables: { where: { broker: address, minted: false } },
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    if (!isPolling && startPolling) {
      startPolling(200);
      setIsPolling(true);
    }
  }, [startPolling, isPolling]);

  if (loading) return <p className="leading-7">Loading...</p>;
  console.log(isPolling);
  if (error)
    return (
      <p className="leading-7">
        Error fetching RECs pending mint: {error.message}
      </p>
    );

  if (data.filteredMetadata.length === 0)
    return <p className="leading-7">No RECs pending mint</p>;

  return (
    <table className="w-full">
      <thead>
        <tr className="m-0 border-t border-slate-300 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Cid
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
            Energy Sources
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Volume (Wh)
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        {data.filteredMetadata.map((m) => {
          return <PendingRecsRow key={m.cid} metadata={m} />;
        })}
      </tbody>
    </table>
  );
}
