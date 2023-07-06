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

function MyRecRow({ id, isRedeemer }) {
  const { address } = useAccount();
  console.log(id);
  const {
    data: metadata,
    isError: metadataIsError,
    isLoading: metadataIsLoading,
  } = useContractReads({
    contracts: [
      // @ts-ignore
      {
        ...recMarketplace,
        functionName: 'supplyOf',
        args: [id],
      },
      // @ts-ignore
      {
        ...recMarketplace,
        functionName: 'balanceOf',
        args: [address, id],
      },
      // @ts-ignore
      {
        ...recMarketplace,
        functionName: 'amountRedeemed',
        args: [address, id],
      },
    ],
    watch: true,
  });

  const { config } = usePrepareContractWrite(
    // @ts-ignore
    {
      ...recMarketplace,
      functionName: 'redeem',
      args: [id, metadata?.[1] ?? 0],
    }
  );
  const { writeAsync } = useContractWrite(config);
  console.log(metadata);
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

export function MyRecsTable({ isRedeemer }) {
  const {
    data: nextId,
    isLoading,
    isError,
  } = useContractRead(
    // @ts-ignore
    {
      ...recMarketplace,
      functionName: 'nextId',
    }
  );

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
            RECs owned
          </th>
          {isRedeemer && (
            <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
              RECs Redeemed
            </th>
          )}
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Total Supply
          </th>
          {isRedeemer && (
            <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
              Redeem
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {
          // @ts-ignore
          [...Array(Number(nextId)).keys()].map((e) => {
            return <MyRecRow id={e} key={e} isRedeemer={isRedeemer} />;
          })
        }
      </tbody>
    </table>
  );
}
