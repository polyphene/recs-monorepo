import { toast } from 'react-toastify';
import {
  useAccount,
  useContractRead,
  useContractReads,
  useContractWrite,
  usePrepareContractWrite,
} from 'wagmi';

import recMarketplace from '@/config/rec-marketplace';
import { waitTx } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {useEffect, useState} from "react";
import {useQuery} from "@apollo/client";
import {METADATA_BY_CREATOR} from "@/lib/graphql";

function RoleRow({ id, isRedeemer }) {
  const { address } = useAccount();

  const {
    data: metadata,
    isError: metadataIsError,
    isLoading: metadataIsLoading,
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
    ],
    watch: true,
  });

  const { config } = usePrepareContractWrite({
    ...recMarketplace,
    functionName: 'redeem',
    args: [id, metadata?.[1] ?? 0],
  });
  const { writeAsync } = useContractWrite(config);

  if (
    metadataIsLoading ||
    metadataIsError ||
    !metadata?.[0] ||
    (metadata?.[1].toString() === '0' && metadata?.[2].toString() === '0')
  )
    return <></>;

  return (
    <tr className="m-0 border-t border-slate-200 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {id}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {metadata?.[1].toString()}
      </td>
      {isRedeemer && (
        <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
          {metadata[2].toString()}
        </td>
      )}
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {metadata[0].toString()}
      </td>
      {isRedeemer && (
        <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
          {metadata?.[1].toString() !== '0' ? (
            <Button
              disabled={
                !metadata?.[1] ||
                metadata?.[1].toString() === '0' ||
                !writeAsync
              }
              onClick={() => {
                toast.promise(waitTx(writeAsync?.()), {
                  pending: `Redeeming RECs with id ${id}`,
                  success: 'RECs redeemed !',
                  error: "Couldn't redeem RECs",
                });
              }}
            >
              Redeem
            </Button>
          ) : (
            '✅'
          )}
        </td>
      )}
    </tr>
  );
}

export function RolesTable({ isRedeemer }) {
  const [isPolling, setIsPolling] = useState(false);
  const { loading, error, data, previousData, startPolling, stopPolling } =
    useQuery(METADATA_BY_CREATOR, {
      variables: { broker: address },
      fetchPolicy: 'cache-and-network',
    });

  useEffect(() => {
    if (!isPolling && startPolling) {
      startPolling(200);
      setIsPolling(true);
    }
  }, [startPolling, isPolling]);

  if (loading) return <p className="leading-7">Loading...</p>;

  if (error)
    return (
      <p className="leading-7">
        Error fetching RECs pending mint: {error.message}
      </p>
    );

  if (data.metadataByCreator.length === 0)
    return <p className="leading-7">No RECs pending mint</p>;

  return (
    <table className="w-full">
      <thead>
        <tr className="m-0 border-t border-slate-300 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Account
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Roles
          </th>
          )}
        </tr>
      </thead>
      <tbody>
        {[...Array(Number(nextId)).keys()].map((e) => {
          return <MyRecRow id={e} key={e} isRedeemer={isRedeemer} />;
        })}
      </tbody>
    </table>
  );
}
