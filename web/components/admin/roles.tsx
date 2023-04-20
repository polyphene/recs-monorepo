import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { toast } from 'react-toastify';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';

import recMarketplace from '@/config/rec-marketplace';
import { ROLES } from '@/lib/graphql';
import { ADMIN_ROLE, MINTER_ROLE, REDEEMER_ROLE, waitTx } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

type RoleUpdate = {
  fn: string;
  role: string;
};

type RoleState = {
  tmp: boolean;
  old: boolean;
};

const roleUpdate = (
  admin: RoleState,
  minter: RoleState,
  redeemer: RoleState
): RoleUpdate => {
  if (admin.old !== admin.tmp) {
    return {
      fn: admin.tmp ? 'grantRole' : 'revokeRole',
      role: ADMIN_ROLE,
    };
  } else if (minter.old !== minter.tmp) {
    return {
      fn: minter.tmp ? 'grantRole' : 'revokeRole',
      role: MINTER_ROLE,
    };
  }
  return {
    fn: redeemer.tmp ? 'grantRole' : 'revokeRole',
    role: REDEEMER_ROLE,
  };
};

function RoleRow({ address, isRedeemer, isMinter, isAdmin }) {
  const [tmpIsRedeemer, setTmpIsRedeemer] = useState(isRedeemer);
  const [tmpIsMinter, setTmpIsMinter] = useState(isMinter);
  const [tmpIsAdmin, setTmpIsAdmin] = useState(isAdmin);

  const update = roleUpdate(
    { old: isAdmin, tmp: tmpIsAdmin },
    { old: isMinter, tmp: tmpIsMinter },
    { old: isRedeemer, tmp: tmpIsRedeemer }
  );

  const { config } = usePrepareContractWrite(
    // @ts-ignore
    {
      ...recMarketplace,
      functionName: update?.fn,
      args: [update?.role, address],
    }
  );

  const { writeAsync } = useContractWrite(config);

  return (
    <tr className="m-0 border-t border-slate-200 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {address}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        <div className="flex flex-col items-center">
          <div className="flex flex-row items-center">
            <label
              htmlFor="isAdmin"
              className="mr-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Admin
            </label>
            <Checkbox
              id="isAdmin"
              className="mr-5"
              checked={tmpIsAdmin}
              onClick={() => setTmpIsAdmin(!tmpIsAdmin)}
            />
            <label
              htmlFor="isMinter"
              className="mr-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Minter
            </label>
            <Checkbox
              id="isMinter"
              className="mr-5"
              checked={tmpIsMinter}
              onClick={() => setTmpIsMinter(!tmpIsMinter)}
            />
            <label
              htmlFor="isRedeemer"
              className="mr-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Redeemer
            </label>
            <Checkbox
              id="isRedeemer"
              className="mr-5"
              checked={tmpIsRedeemer}
              onClick={() => setTmpIsRedeemer(!tmpIsRedeemer)}
            />
            <Button
              disabled={
                !writeAsync ||
                (tmpIsRedeemer === isRedeemer &&
                  tmpIsAdmin === isAdmin &&
                  tmpIsMinter === isMinter)
              }
              onClick={() => {
                toast.promise(waitTx(writeAsync?.()), {
                  pending: `Updating role for ${address}`,
                  success: 'Role updated !',
                  error: "Couldn't update role",
                });
              }}
            >
              Update
            </Button>
          </div>
        </div>
      </td>
    </tr>
  );
}

export function RolesTable({ isRedeemer }) {
  const [isPolling, setIsPolling] = useState(false);
  const { loading, error, data, startPolling } = useQuery(ROLES, {
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    if (!isPolling && startPolling) {
      startPolling(200);
      setIsPolling(true);
    }
  }, [startPolling, isPolling]);

  if (loading) return <p className="leading-7">Loading...</p>;

  if (error)
    return (
      <p className="leading-7">
        Error fetching RECs pending mint: {error.message}
      </p>
    );

  return (
    <table className="w-full">
      <thead>
        <tr className="m-0 border-t border-slate-300 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Account
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Roles
          </th>
        </tr>
      </thead>
      <tbody>
        {data.roles.map((e) => {
          return (
            <RoleRow
              key={e.address}
              address={e.address}
              isRedeemer={e.isRedeemer}
              isMinter={e.isMinter}
              isAdmin={e.isAdmin}
            />
          );
        })}
      </tbody>
    </table>
  );
}
