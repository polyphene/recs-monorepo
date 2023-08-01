import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { BigNumber } from 'ethers';
import { useAccount } from 'wagmi';

import { FILTERED_USERS } from '@/lib/graphql';
import { ListRecs } from '@/components/list-recs-dialog';

function ListRecsRow({
  balance: {
    amount,
    collection: {
      filecoinTokenId,
      metadata: { volume, country, region, reportingStart, reportingEnd, cid },
    },
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
        {volume}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        <ListRecs id={filecoinTokenId} />
      </td>
    </tr>
  );
}

export function ListRecsTable() {
  const { address } = useAccount();
  const [isPolling, setIsPolling] = useState(false);

  const { loading, error, data, startPolling } = useQuery(FILTERED_USERS, {
    variables: { where: { address } },
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
  if (
    !data?.filteredUsers[0] ||
    data.filteredUsers[0].balances.filter((b) =>
      BigNumber.from(b.amount).gt(BigNumber.from('0'))
    ).length === '0'
  )
    return <p>No RECs owned</p>;

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
            Cid
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            RECs owned
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Total Supply
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        {data.filteredUsers[0].balances
          .filter((b) => BigNumber.from(b.amount).gt(BigNumber.from('0')))
          .map((b) => {
            return (
              <ListRecsRow balance={b} key={b.collection.filecoinTokenId} />
            );
          })}
      </tbody>
    </table>
  );
}
