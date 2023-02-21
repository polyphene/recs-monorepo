import { useAccount, useContractReads } from 'wagmi';

import recMarketplace from '@/config/rec-marketplace';
import { store } from '@/lib/storage';
import { MintedRecsTable } from '@/components/dashboard/minted-recs';
import { MyRecsTable } from '@/components/dashboard/my-recs';
import { MintRECs } from '@/components/mint-recs-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function Dashboard() {
  const { address } = useAccount();

  const {
    data: roleData,
    isLoading: roleDataLoading,
    isError: roleDataError,
  } = useContractReads({
    contracts: [
      {
        ...recMarketplace,
        functionName: 'MINTER_ROLE',
      },
      {
        ...recMarketplace,
        functionName: 'REDEEMER_ROLE',
      },
    ],
  });

  const {
    data: isRoleData,
    isLoading: isRoleDataLoading,
    isError: isRoleDataError,
  } = useContractReads({
    contracts: [
      {
        ...recMarketplace,
        functionName: 'hasRole',
        args: [roleData?.[0], address],
      },
      {
        ...recMarketplace,
        functionName: 'hasRole',
        args: [roleData?.[1], address],
      },
    ],
  });

  if (
    !isRoleData ||
    !roleData ||
    isRoleDataLoading ||
    isRoleDataError ||
    roleDataLoading ||
    roleDataError
  )
    return <></>;

  console.log(isRoleData);

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
            <div className="flex items-center pt-4">
              <p className="pr-6 text-xl text-slate-700 dark:text-slate-400">
                Pending Mint
              </p>
              <MintRECs />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
}
