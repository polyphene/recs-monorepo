import { useRouter } from 'next/router';
import { useAccount, useContractRead } from 'wagmi';

import recMarketplace from '@/config/rec-marketplace';
import { ADMIN_ROLE } from '@/lib/utils';
import { RolesTable } from '@/components/admin/roles';
import { SetRole } from '@/components/set-role-dialog';
import { Separator } from '@/components/ui/separator';

export const Admin = () => {
  const { address } = useAccount();
  const router = useRouter();

  const {
    data: isAdmin,
    isLoading: isAdminLoading,
    isError: isAdminError,
  } = useContractRead({
    ...recMarketplace,
    functionName: 'hasRole',
    args: [ADMIN_ROLE, address],
  });

  if (isAdminLoading || isAdminError) return <></>;

  if (!isAdmin) router.push('/');

  return (
    <section className="container grid items-center gap-6 pt-6 pb-8 md:py-10">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Administration panel
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Assign and remove role.
          </p>
        </div>
      </div>
      <Separator className="my-4" />
      <SetRole />
      <RolesTable isRedeemer={true} />
    </section>
  );
};
