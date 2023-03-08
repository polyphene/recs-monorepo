import { useRouter } from 'next/router';
import { useAccount, useContractRead } from 'wagmi';

import recMarketplace from '@/config/rec-marketplace';
import { RolesTable } from '@/components/admin/roles';
import { Separator } from '@/components/ui/separator';

export const Admin = () => {
  const { address } = useAccount();
  const router = useRouter();

  const {
    data: adminRole,
    isLoading: adminRoleLoading,
    isError: adminRoleError,
  } = useContractRead({
    ...recMarketplace,
    functionName: 'DEFAULT_ADMIN_ROLE',
  });

  const {
    data: isAdmin,
    isLoading: isAdminLoading,
    isError: isAdminError,
  } = useContractRead({
    ...recMarketplace,
    functionName: 'hasRole',
    args: [adminRole, address],
  });

  if (
    !adminRole ||
    adminRoleLoading ||
    adminRoleError ||
    isAdminLoading ||
    isAdminError
  )
    return <></>;

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
      <RolesTable isRedeemer={true} />
    </section>
  );
};
