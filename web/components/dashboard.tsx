import {Separator} from "@/components/ui/separator";
import {useAccount, useContractRead, useContractReads, useContractWrite, usePrepareContractWrite} from "wagmi";
import recMarketplace from "@/config/rec-marketplace";
import {MintRECs} from "@/components/mint-recs-dialog";
import useIsSSR from "@/lib/useIsSSR";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useState} from "react";
import {toast} from "react-toastify";
import {waitTx} from "@/lib/utils";


function MintedRecRow({id}) {
  const {address} = useAccount();
  const [cid, setCID] = useState("");


  const {
    data,
    isError: metadataIsError,
    isLoading: metadataIsLoading
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
        args: [id]
      }
    ],
  });

  if (data?.[3] !== address || metadataIsError || metadataIsLoading || !data) return <></>

  return <tr
    className="m-0 border-t border-slate-200 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
    <td
      className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
      {id}
    </td>
    <td
      className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
      {data[1].toString()}
    </td>
    <td
      className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
      {data[0].toString()}
    </td>
    <td
      className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
      {data[2] ? data[2] : data[0].eq(data[1]) ?
        <div className="flex w-full items-center space-x-2"><Input id="statement-cid" placeholder="CID"
                                                                   onChange={e => setCID(e.target.value)}
                                                                   value={cid}/><Button>Attach</Button></div> : '❌'}
    </td>
  </tr>
}

function MintedRecsTable() {

  const {data: nextId, isLoading, isError} = useContractRead({
    ...recMarketplace,
    functionName: 'nextId'
  });

  if (isLoading) <p>Loading...</p>
  if (isError) <p>Couldn't fetch next REC id</p>

  return <table className="w-full">
    <thead>
    <tr
      className="m-0 border-t border-slate-300 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
      <th
        className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        Id
      </th>
      <th
        className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        Supply
      </th>
      <th
        className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        Redeemed Supply
      </th>
      <th
        className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        Redemption Statement
      </th>
    </tr>
    </thead>
    <tbody>
    {
      [...Array(Number(nextId)).keys()].map((e) => {
        return <MintedRecRow id={e} key={e}/>
      })
    }
    </tbody>
  </table>
}

function MyRecRow({id, isRedeemer}) {
  const {address} = useAccount();

  const {
    data: metadata,
    isError: metadataIsError,
    isLoading: metadataIsLoading
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
        args: [address, id]
      }
    ],
  });

  const {config} = usePrepareContractWrite(
    {
      ...recMarketplace,
      functionName: 'redeem',
      args: [
        id,
        metadata?.[1] ?? 0
      ]
    }
  );
  const {writeAsync} = useContractWrite(config);

  if (metadataIsLoading || metadataIsError || !metadata?.[0] || (metadata?.[1].toString() === "0" && metadata?.[2].toString() === "0")) return <></>

  return <tr
    className="m-0 border-t border-slate-200 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
    <td
      className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
      {id}
    </td>
    <td
      className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
      {metadata?.[1].toString()}
    </td>
    {isRedeemer && <td
      className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
      {metadata[2].toString()}
    </td>}
    <td
      className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
      {metadata[0].toString()}
    </td>
    {isRedeemer && <td
      className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
      {metadata?.[1].toString() !== "0" ?
        <Button disabled={!metadata?.[1] || metadata?.[1].toString() === "0" || !writeAsync} onClick={() => {
          toast.promise(waitTx(writeAsync?.()), {
            pending: `Redeeming RECs with id ${id}`,
            success: 'RECs redeemed !',
            error: 'Couldn\'t redeem RECs'
          });
        }}>Redeem</Button> : '✅'}
    </td>}
  </tr>
}

function MyRecsTable({isRedeemer}) {

  const {data: nextId, isLoading, isError} = useContractRead({
    ...recMarketplace,
    functionName: 'nextId'
  });

  if (isLoading) <p>Loading...</p>
  if (isError) <p>Couldn't fetch next REC id</p>

  return <table className="w-full">
    <thead>
    <tr
      className="m-0 border-t border-slate-300 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
      <th
        className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        Id
      </th>
      <th
        className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        RECs owned
      </th>
      {isRedeemer && <th
        className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        RECs Redeemed
      </th>}
      <th
        className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        Total Supply
      </th>
      {isRedeemer && <th
        className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        Redeem
      </th>
      }
    </tr>
    </thead>
    <tbody>
    {
      [...Array(Number(nextId)).keys()].map((e) => {
        return <MyRecRow id={e} key={e} isRedeemer={isRedeemer}/>
      })
    }
    </tbody>
  </table>
}

export function Dashboard() {
  const isSSR = useIsSSR();

  const {address} = useAccount();
  console.log(address)
  const {data: roleData, isLoading: roleDataLoading, isError: roleDataError} = useContractReads({
    contracts: [
      {
        ...recMarketplace,
        functionName: 'MINTER_ROLE'
      }, {
        ...recMarketplace,
        functionName: 'REDEEMER_ROLE'
      }
    ]
  });
  console.log(roleData)
  const {data: isRoleData, isLoading: isRoleDataLoading, isError: isRoleDataError} = useContractReads({
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
      }
    ]
  });

  if (!isRoleData || !roleData || isRoleDataLoading || isRoleDataError || roleDataLoading || roleDataError) return <></>

  return (
    <section className="container grid items-center gap-6 pt-6 pb-8 md:py-10">
      {
        !isSSR && <>
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
          <MyRecsTable isRedeemer={isRoleData?.[1]}/>
        </>
      }
      {
        !isSSR && isRoleData?.[0] && <><Separator className="my-4"/>
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
          <MintRECs/>
          <MintedRecsTable/>
        </>
      }
    </section>
  )
}
