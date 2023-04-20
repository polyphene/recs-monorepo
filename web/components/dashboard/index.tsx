import { useEffect } from 'react';
import { useAccount, useContractReads } from 'wagmi';

import recMarketplace from '@/config/rec-marketplace';
import { MINTER_ROLE, REDEEMER_ROLE } from '@/lib/utils';
import { MintedRecsTable } from '@/components/dashboard/minted-recs';
import { MyRecsTable } from '@/components/dashboard/my-recs';
import { PendingRecsTable } from '@/components/dashboard/pending-recs';
import { ParseMetadata } from '@/components/parse-metadata-dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function Dashboard() {
  const { address } = useAccount();

  const {
    data: isRoleData,
    isLoading: isRoleDataLoading,
    isError: isRoleDataError,
  } = useContractReads({
    contracts: [
      // @ts-ignore
      {
        ...recMarketplace,
        functionName: 'hasRole',
        args: [MINTER_ROLE, address],
      },
      // @ts-ignore
      {
        ...recMarketplace,
        functionName: 'hasRole',
        args: [REDEEMER_ROLE, address],
      },
    ],
  });

  if (!isRoleData || isRoleDataLoading || isRoleDataError) return <></>;

  return (
    <section className="container grid items-center gap-6 pt-6 pb-8 md:py-10">
      <Tabs defaultValue="owner" className="h-full space-y-6">
        <div className="space-between flex flex-col">
          <TabsList className="w-fit">
            <TabsTrigger value="owner" className="relative">
              Owner
            </TabsTrigger>
            <TabsTrigger value="minter" disabled={!isRoleData?.[0]}>
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
            <MyRecsTable isRedeemer={isRoleData?.[1]} />
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
