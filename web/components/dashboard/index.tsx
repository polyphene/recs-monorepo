import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { useAccount } from 'wagmi';

import { FILTERED_USERS } from '@/lib/graphql';
import { MintedRecsTable } from '@/components/dashboard/minted-recs';
import { MyRecsTable } from '@/components/dashboard/my-recs';
import { PendingRecsTable } from '@/components/dashboard/pending-recs';
import { ParseMetadata } from '@/components/parse-metadata-dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function Dashboard() {
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

  if (loading || error || !data) return <></>;

  return (
    <section className="container grid items-center gap-6 pt-6 pb-8 md:py-10">
      <Tabs defaultValue="owner" className="h-full space-y-6">
        <div className="space-between flex flex-col">
          <TabsList className="w-fit">
            <TabsTrigger value="owner" className="relative">
              Owner
            </TabsTrigger>
            <TabsTrigger
              value="minter"
              disabled={!data?.filteredUsers[0].isMinter}
            >
              Minter
            </TabsTrigger>
          </TabsList>
          <TabsContent value="owner" className="border-none p-0 pt-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Owned RECs
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Browse your owned RECs. Redeem them.
                </p>
              </div>
            </div>
            <Separator className="my-4" />
            <MyRecsTable
              isRedeemer={data?.filteredUsers[0].isRedeemer}
              balances={data?.filteredUsers[0].balances}
            />
          </TabsContent>
          <TabsContent value="minter" className="border-none p-0 pt-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Mint RECs
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Mint new RECs. Manage them.
                </p>
              </div>
            </div>
            <Separator className="my-4" />
            <p className="text-xl text-slate-700 dark:text-slate-400">
              Minted RECs
            </p>
            <MintedRecsTable />
            <div className="flex items-center py-4">
              <p className="pr-6 text-xl text-slate-700 dark:text-slate-400">
                Pending Mint
              </p>
              <ParseMetadata />
            </div>
            <PendingRecsTable />
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
}
