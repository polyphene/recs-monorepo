import { useQuery } from '@apollo/client';
import { ClipboardCopy } from 'lucide-react';
import { useAccount } from 'wagmi';

import { METADATA_BY_CREATOR } from '@/lib/graphql';
import { MintRECs } from '@/components/mint-recs-dialog';

function PendingRecsRow({
  metadata: {
    cid,
    country,
    region,
    reportingStart,
    reportingEnd,
    energySources,
    volumeMWh,
  },
}) {
  return (
    <tr className="m-0 border-t border-slate-200 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        <div className="flex items-center">
          <a
            className="underline hover:no-underline"
            href={`https://explore.ipld.io/#/explore/${cid}`}
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
        {volumeMWh}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        <MintRECs cid={cid} volume={volumeMWh} />
      </td>
    </tr>
  );
}

export function PendingRecsTable() {
  const { address } = useAccount();
  const { loading, error, data, previousData } = useQuery(METADATA_BY_CREATOR, {
    variables: { broker: address },
    pollInterval: 500,
  });
  console.log(loading, error, previousData, data);
  if (loading) return <p className="leading-7">Loading...</p>;

  if (error)
    return (
      <p className="leading-7">
        Error fetching RECs pending mint: {error.message}
      </p>
    );

  if (data.metadataByCreator.length === 0)
    return <p className="leading-7">No RECs pending mint</p>;
  console.log(data);
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
            Volume (MWh)
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        {data.metadataByCreator.map((m) => {
          if (m.minted) return <></>;
          return <PendingRecsRow key={m.cid} metadata={m} />;
        })}
      </tbody>
    </table>
  );
}
