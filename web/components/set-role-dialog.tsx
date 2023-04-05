'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';

import recMarketplace from '@/config/rec-marketplace';
import { ADMIN_ROLE, MINTER_ROLE, REDEEMER_ROLE, waitTx } from '@/lib/utils';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function SetRole() {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('');

  const { config } = usePrepareContractWrite({
    ...recMarketplace,
    functionName: 'grantRole',
    args: [role, address],
  });
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
        <Button className="w-fit">Add account</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Grant Role</DialogTitle>
          <DialogDescription>Grant a role to a new account.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="volume" className="text-right">
              Address
            </Label>
            <Input
              id="volume"
              placeholder="Volume"
              className="col-span-3"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit-price" className="text-right">
              Role
            </Label>
            <Select onValueChange={(v) => setRole(v)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ADMIN_ROLE}>Admin</SelectItem>
                <SelectItem value={MINTER_ROLE}>Minter</SelectItem>
                <SelectItem value={REDEEMER_ROLE}>Redeemer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!writeAsync && !address && !role}
            onClick={() => {
              toast.promise(waitTx(writeAsync?.()), {
                pending: 'Granting role',
                success: 'Role granted !',
                error: "Couldn't grant role",
              });
            }}
          >
            Grant role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
