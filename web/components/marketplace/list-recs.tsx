import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { toast } from 'react-toastify';
import {
  useAccount,
  useContractRead,
  useContractReads,
  useContractWrite,
  usePrepareContractWrite,
} from 'wagmi';

import recMarketplace from '@/config/rec-marketplace';
import { METADATA_BY_CID } from '@/lib/graphql';
import { waitTx } from '@/lib/utils';
import { ListRecs } from '@/components/list-recs-dialog';
import { MintRECs } from '@/components/mint-recs-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function ListRecsRow({ id }) {
  const { address } = useAccount();
  const [listvolume, setListVolume] = useState(null);
  const [listPrice, setListPrice] = useState(null);

  const {
    data: onChainData,
    isError: onChainDataError,
    isLoading: onchainDataLoading,
  } = useContractReads({
    contracts: [
      {
        ...recMarketplace,
        functionName: 'supplyOf',
        args: [id],
      },
      {
        ...recMarketplace,
        functionName: 'balanceOf',
        args: [address, id],
      },
      {
        ...recMarketplace,
        functionName: 'amountRedeemed',
        args: [address, id],
      },
      {
        ...recMarketplace,
        functionName: 'uri',
        args: [id],
      },
      {
        ...recMarketplace,
        functionName: 'tokenListing',
        args: [id],
      },
    ],
    watch: true,
  });
  console.log(onChainData);
  const {
    data,
    loading: metadataLoading,
    error: metadataError,
  } = useQuery(METADATA_BY_CID, {
    variables: { cid: onChainData?.[3] ?? '' },
  });

  if (
    onChainDataError ||
    onchainDataLoading ||
    !onChainData?.[0] ||
    (onChainData?.[1].toString() === '0' &&
      onChainData?.[2].toString() === '0') ||
    metadataLoading ||
    metadataError ||
    !data?.metadataByCid
  )
    return <></>;

  return (
    <tr className="m-0 border-t border-slate-200 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {id}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {data.metadataByCid.country}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {data.metadataByCid.region}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {data.metadataByCid.reportingStart}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {data.metadataByCid.reportingEnd}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        <a
          className="underline hover:no-underline"
          href={`https://explore.ipld.io/#/explore/${onChainData?.[3].toString()}`}
          target="_blank"
          rel="noreferrer"
        >
          {onChainData?.[3].toString().substring(0, 14)}...
          {onChainData?.[3]
            .toString()
            .substring(
              onChainData?.[3].toString().length - 14,
              onChainData?.[3].toString().length
            )}
        </a>
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {onChainData[1].toString()}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {onChainData[0].toString()}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {onChainData?.[4].tokenAmount.toString() ?? '0'}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        <ListRecs id={id} />
      </td>
    </tr>
  );
}

export function ListRecsTable() {
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
  if (isError) return <p>Couldn&apos;t fetch next REC id</p>;
  if (nextId.toString() === '0') return <p>No RECs owned</p>;

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
            Currently Listed
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        {[...Array(Number(nextId)).keys()].map((e) => {
          return <ListRecsRow id={e} key={e} />;
        })}
      </tbody>
    </table>
  );
}
