import {Separator} from "@/components/ui/separator";
import {useAccount, useContractRead} from "wagmi";
import recMarketplace from "@/config/rec-marketplace";
import {DialogDemo} from "@/components/mint-recs-dialog";
import useIsSSR from "@/lib/useIsSSR";

export function Dashboard() {
  const isSSR = useIsSSR();

  const {address} = useAccount();
  const {data: minterRole} = useContractRead({
    ...recMarketplace,
    functionName: 'MINTER_ROLE'
  });

  const {data: isMinter} = useContractRead({
    ...recMarketplace,
    functionName: 'hasRole',
    args: [minterRole, address],
  });


  return (
    <section className="container grid items-center gap-6 pt-6 pb-8 md:py-10">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            My Renewable Energy Certificates
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Overview of the RECs you own.
          </p>
        </div>
      </div>
      {
        !isSSR && isMinter && <><Separator className="my-4"/>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">
                Renewable Energy Certificates minted
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Overview of the RECs you minted
              </p>
            </div>
          </div>
          <DialogDemo/>
        </>
      }
    </section>
  )
}
