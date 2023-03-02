import { useState } from 'react';
import { useAccount, useContractRead, useContractReads } from 'wagmi';

import recMarketplace from '@/config/rec-marketplace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function MintedRecRow({ id }) {
  const { address } = useAccount();
  const [cid, setCID] = useState('');

  const {
    data,
    isError: metadataIsError,
    isLoading: metadataIsLoading,
  } = useContractReads({
    contracts: [
      {
        ...recMarketplace,
        functionName: 'redeemedSupplyOf',
        args: [id],
      },
      {
        ...recMarketplace,
        functionName: 'supplyOf',
        args: [id],
      },
      {
        ...recMarketplace,
        functionName: 'redemptionStatementOf',
        args: [id],
      },
      {
        ...recMarketplace,
        functionName: 'minterOf',
        args: [id],
      },
    ],
    watch: true,
  });
  console.log(data);
  if (data?.[3] !== address || metadataIsError || metadataIsLoading || !data)
    return <></>;

  return (
    <tr className="m-0 border-t border-slate-200 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {id}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {data[1].toString()}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {data[0].toString()}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {data[2] ? (
          data[2]
        ) : data[0].eq(data[1]) ? (
          <div className="flex w-full items-center space-x-2">
            <Input
              id="statement-cid"
              placeholder="CID"
              onChange={(e) => setCID(e.target.value)}
              value={cid}
            />
            <Button>Attach</Button>
          </div>
        ) : (
          '❌'
        )}
      </td>
    </tr>
  );
}

export function MintedRecsTable() {
  const {
    data: nextId,
    isLoading,
    isError,
  } = useContractRead({
    ...recMarketplace,
    functionName: 'nextId',
    watch: true,
  });

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Couldn't fetch next REC id</p>;
  if (nextId.toString() === '0') return <p>No RECs minted</p>;

  return (
    <table className="w-full">
      <thead>
        <tr className="m-0 border-t border-slate-300 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Id
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Supply
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Redeemed Supply
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Redemption Statement
          </th>
        </tr>
      </thead>
      <tbody>
        {[...Array(Number(nextId)).keys()].map((e) => {
          return <MintedRecRow id={e} key={e} />;
        })}
      </tbody>
    </table>
  );
}
