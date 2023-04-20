import { useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { useTheme } from 'next-themes';
import { err } from 'pino-std-serializers';
import { toast } from 'react-toastify';
import { useAccount, useConnect } from 'wagmi';

import { Button } from '@/components/ui/button';

export function NoWallet() {
  const { theme } = useTheme();
  const { connector: activeConnector, isConnected } = useAccount();
  const { connect, connectors, error, isLoading, pendingConnector } =
    useConnect();

  useEffect(() => {
    if (error !== null) {
      toast.error(`Error while connecting to wallet.`, { theme });
    }
  }, [error?.message, error, theme]);

  return (
    <section className="container grid items-center gap-6 pt-6 pb-8 md:py-10">
      <div className="flex flex-col items-center gap-2">
        <Wallet className="mr-2" size="96" />
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter sm:text-3xl md:text-5xl lg:text-6xl">
          Get started by connecting your wallet.
        </h1>
        <p className="max-w-[700px] text-lg text-slate-700 dark:text-slate-400 sm:text-xl">
          To access the dashboard please connect to a valid ethereum wallet.
        </p>
      </div>
      <div className="flex justify-center gap-4">
        {connectors.map((connector) => {
          return (
            <Button
              key={connector.id}
              onClick={() => {
                connect({ connector });
              }}
            >
              Connect wallet
            </Button>
          );
        })}
      </div>
    </section>
  );
}
