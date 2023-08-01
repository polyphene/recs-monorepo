import { toast } from 'react-toastify';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';

import recMarketplace from '@/config/rec-marketplace';
import { waitTx } from '@/lib/utils';
import { Button } from '@/components/ui/button';

function MyRecRow({ id, isRedeemer, redeemedVolume, balance, volume }) {
  const { config } = usePrepareContractWrite(
    // @ts-ignore
    {
      ...recMarketplace,
      functionName: 'redeem',
      args: [id, balance],
    }
  );
  const { writeAsync } = useContractWrite(config);

  if (balance === '0' && redeemedVolume === '0') return <></>;

  return (
    <tr className="m-0 border-t border-slate-200 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {id}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {balance}
      </td>
      {isRedeemer && (
        <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
          {redeemedVolume}
        </td>
      )}
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {volume}
      </td>
      {isRedeemer && (
        <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
          {balance !== '0' ? (
            <Button
              disabled={balance === '0' || !writeAsync}
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

export function MyRecsTable({ isRedeemer, balances }) {
  if (balances.length === 0) return <p>No RECs owned</p>;

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
        {balances
          .toSorted(
            (a, b) =>
              parseInt(a.collection.filecoinTokenId, 10) -
              parseInt(b.collection.filecoinTokenId, 10)
          )
          .map((b) => {
            return (
              <MyRecRow
                id={b.collection.filecoinTokenId}
                key={b.collection.filecoinTokenId}
                redeemedVolume={b.redeemed}
                volume={b.collection.metadata.volume}
                balance={b.amount}
                isRedeemer={isRedeemer}
              />
            );
          })}
      </tbody>
    </table>
  );
}
