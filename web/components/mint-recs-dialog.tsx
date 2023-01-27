"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {Plus} from "lucide-react";
import useIsSSR from "@/lib/useIsSSR";
import {useContract} from "wagmi";
import recMarketplace from "@/config/rec-marketplace";

export function DialogDemo() {
  const isSSR = useIsSSR()

  const recContract = useContract(
    recMarketplace
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-fit"><Plus className="mr-1"/>Mint RECs</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mint RECs</DialogTitle>
          <DialogDescription>
            Set for your RECS. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cid" className="text-right">
              CID
            </Label>
            <Input id="cid" placeholder="CID" className="col-span-3" />
          </div>
          <div className="flex flex-row-reverse">
            <p className="text-sm text-slate-500">The CID should refer to the RECs metadata.</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input id="amount" placeholder="Amount" type="number" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button >Mint</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
