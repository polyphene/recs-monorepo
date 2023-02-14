"use client"

import {Button} from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Plus} from "lucide-react";
import {useContractWrite, usePrepareContractWrite} from "wagmi";
import recMarketplace from "@/config/rec-marketplace";
import {useState} from "react";
import {toast} from "react-toastify";
import {waitTx} from "@/lib/utils";

export function MintRECs() {
  const [open, setOpen] = useState(false);
  const [cid, setCID] = useState("");
  const [amount, setAmount] = useState(0);

  const {config} = usePrepareContractWrite(
    {
      ...recMarketplace,
      functionName: 'mintAndAllocate',
      args: [
        cid,
        amount,
        [],
        []
      ]
    }
  );
  const {writeAsync} = useContractWrite({
    ...config, onSettled: (data, error) => {
      if (!error) {
        setCID("");
        setOpen(false);
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-fit"><Plus className="mr-1"/>Mint RECs</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mint RECs</DialogTitle>
          <DialogDescription>
            Set for your RECS. Click mint when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cid" className="text-right">
              CID
            </Label>
            <Input id="cid" placeholder="CID" className="col-span-3" value={cid}
                   onChange={e => setCID(e.target.value)}/>
          </div>
          <div className="flex flex-row-reverse">
            <p className="text-sm text-slate-500">The CID should refer to the RECs metadata.</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input id="amount" placeholder="Amount" type="number" className="col-span-3"
                   onChange={e => setAmount(Number(e.target.value))}/>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!writeAsync && !cid && amount === 0} onClick={() => {
            toast.promise(waitTx(writeAsync?.()), {
              pending: 'Minting RECs',
              success: 'RECs minted !',
              error: 'Couldn\'t mint RECs'
            });
          }}>Mint</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
