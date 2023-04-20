'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';

import recMarketplace from '@/config/rec-marketplace';
import { waitTx } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Allocation = {
  address: string;
  amount: number;
  redeem: boolean;
};

export function MintRECs({ cid, volume }) {
  const [open, setOpen] = useState(false);
  const [allocations, setAllocations] = useState<Allocation[]>([]);

  const { config } = usePrepareContractWrite(
    // @ts-ignore
    {
      ...recMarketplace,
      functionName: 'mintAndAllocate',
      args: [
        cid,
        volume,
        allocations.map((a) => a.address),
        allocations.map((a) => a.amount),
        allocations.map((a) => a.redeem),
      ],
    }
  );
  const { writeAsync } = useContractWrite({
    ...config,
    onSettled: (data, error) => {
      if (!error) {
        setOpen(false);
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-fit">Mint RECs</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mint</DialogTitle>
          <DialogDescription>
            Set for your RECS. Click mint when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cid" className="text-right">
              CID
            </Label>
            <Input
              id="cid"
              placeholder="CID"
              className="col-span-3"
              disabled={true}
              value={cid}
            />
          </div>
          <div className="flex flex-row-reverse">
            <p className="text-sm text-slate-500">
              The CID should refer to the RECs metadata.
            </p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="volume" className="text-right">
              Volume
            </Label>
            <Input
              id="volume"
              placeholder="Volume"
              type="number"
              className="col-span-3"
              disabled={true}
              value={volume}
            />
          </div>
          {allocations.length > 0 &&
            allocations.map((e, i) => {
              return (
                <div className="mt-2 grid items-center gap-4">
                  <div className="grid grid-cols-7 items-center gap-4">
                    <Input
                      id={`allocation-${i}`}
                      placeholder={`Allocation ${i + 1}`}
                      className="col-span-3"
                      onChange={(e) =>
                        setAllocations(
                          allocations.map((a, j) => {
                            if (j === i) {
                              return {
                                ...a,
                                address: e.target.value,
                              };
                            } else {
                              return a;
                            }
                          })
                        )
                      }
                      value={allocations[i].address}
                    />
                    <Input
                      id={`amount-${i}`}
                      placeholder={`Amount ${i + 1}`}
                      type="number"
                      className="col-span-3"
                      onChange={(e) =>
                        setAllocations(
                          allocations.map((a, j) => {
                            if (j === i) {
                              return {
                                ...a,
                                amount: Number(e.target.value),
                              };
                            } else {
                              return a;
                            }
                          })
                        )
                      }
                      value={allocations[i].amount}
                    />
                    <div className="flex flex-col-reverse items-center space-x-2">
                      <Checkbox
                        id={`redeem-${i}`}
                        checked={allocations[i].redeem}
                        onClick={(e) =>
                          setAllocations(
                            allocations.map((a, j) => {
                              if (j === i) {
                                return {
                                  ...a,
                                  redeem: !a.redeem,
                                };
                              } else {
                                return a;
                              }
                            })
                          )
                        }
                        className="mt-2"
                      />
                      <label
                        htmlFor={`redeem-${i}`}
                        className="text-sm text-slate-500 dark:text-slate-400"
                      >
                        Redeem
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              const tmpAllocations: Allocation[] = [
                ...allocations,
                { address: '', amount: 0, redeem: false },
              ];
              setAllocations(tmpAllocations);
            }}
            variant="subtle"
          >
            Add allocation
          </Button>
          <Button
            disabled={!writeAsync && !cid && volume === 0}
            onClick={() => {
              toast.promise(waitTx(writeAsync?.()), {
                pending: 'Minting RECs',
                success: 'RECs minted !',
                error: "Couldn't mint RECs",
              });
            }}
          >
            Mint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
