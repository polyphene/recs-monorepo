'use client';

import { useState } from 'react';
import { BigNumber } from 'ethers';
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

export function BuyRecs({ id, seller, price }) {
  const [open, setOpen] = useState(false);
  const [volume, setVolume] = useState(null);

  const { config } = usePrepareContractWrite(
    // @ts-ignore
    {
      ...recMarketplace,
      functionName: 'buy',
      args: [id, seller, volume ?? 0],
      overrides: {
        value: price * volume,
      },
    }
  );

  const { writeAsync } = useContractWrite({
    ...config,
    onSettled: (data, error) => {
      if (!error) {
        setOpen(false);
        setVolume(null);
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-fit">Buy</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Buy RECs</DialogTitle>
          <DialogDescription>Select a volume to buy.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="volume" className="text-right">
              Volume
            </Label>
            <Input
              id="volume"
              type="number"
              placeholder="Volume"
              className="col-span-3"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit-price" className="text-right">
              Amount to pay (Gwei)
            </Label>
            <Input
              disabled
              id="unit-price"
              placeholder="Unit Price"
              className="col-span-3"
              type="number"
              value={volume * price}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!writeAsync && !volume && volume === 0}
            onClick={() => {
              toast.promise(waitTx(writeAsync?.()), {
                pending: 'Buying RECs',
                success: 'RECs bought !',
                error: "Couldn't buy RECs",
              });
            }}
          >
            Buy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
