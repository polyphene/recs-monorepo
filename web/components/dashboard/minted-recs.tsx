import { useEffect, useState } from 'react';
import { ApolloError, useQuery } from '@apollo/client';
import { toast } from 'react-toastify';
import { useAccount, useContractWrite, usePrepareContractWrite } from 'wagmi';

import recMarketplace from '@/config/rec-marketplace';
import { FILTERED_COLLECTIONS } from '@/lib/graphql';
import { waitTx } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function MintedRecRow({
  collection: {
    filecoinTokenId,
    redeemedVolume,
    metadata: { volume },
    redemptionStatement,
  },
}) {
  const [cid, setCID] = useState('');

  const { config } = usePrepareContractWrite(
    // @ts-ignore
    {
      ...recMarketplace,
      functionName: 'setRedemptionStatement',
      args: [filecoinTokenId, cid],
    }
  );

  const { writeAsync } = useContractWrite(config);

  if (!filecoinTokenId) return <></>;

  return (
    <tr className="m-0 border-t border-slate-200 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {filecoinTokenId}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {volume}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {redeemedVolume}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {redemptionStatement ? (
          <>{redemptionStatement}</>
        ) : redeemedVolume === volume ? (
          <div className="flex w-full items-center space-x-2">
            <Input
              id="statement-cid"
              placeholder="CID"
              onChange={(e) => setCID(e.target.value)}
              value={cid}
            />
            <Button
              disabled={!writeAsync || !cid}
              onClick={() => {
                toast.promise(waitTx(writeAsync?.()), {
                  pending: `Setting redemption statement for token ID ${filecoinTokenId}`,
                  success: 'Redemption statement set !',
                  error: "Couldn't set redemption statement",
                });
              }}
            >
              Attach
            </Button>
          </div>
        ) : (
          <div>❌</div>
        )}
      </td>
    </tr>
  );
}

export function MintedRecsTable() {
  const { address } = useAccount();
  const [isPolling, setIsPolling] = useState(false);

  const {
    data,
    loading,
    error,
    startPolling,
  }: {
    data: {
      filteredCollections: Array<{
        filecoinTokenId: string;
        balances: {
          user: { address: string };
          amount: string;
        };
        metadata: {
          volume: string;
        };
        redeemedVolume: string;
        redemptionStatement;
      }>;
    };
    loading: boolean;
    error?: ApolloError;
    startPolling: (time: number) => void;
  } = useQuery(FILTERED_COLLECTIONS, {
    variables: {
      where: {
        createdBy: address,
      },
    },
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    if (!isPolling && startPolling) {
      startPolling(5000);
      setIsPolling(true);
    }
  }, [startPolling, isPolling]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Couldn&apos;t fetch minted collections</p>;
  if (
    data.filteredCollections.filter((c) => c.filecoinTokenId !== null)
      .length === 0
  )
    return <p>No RECs minted</p>;

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
        {
          // @ts-ignore
          data.filteredCollections.map((c) => {
            return <MintedRecRow collection={c} key={c.filecoinTokenId} />;
          })
        }
      </tbody>
    </table>
  );
}
