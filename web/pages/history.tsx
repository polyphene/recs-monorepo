import Head from 'next/head';
import { useAccount } from 'wagmi';

import useIsSSR from '@/lib/useIsSSR';
import { History } from '@/components/history';
import { Layout } from '@/components/layout';
import { NoWallet } from '@/components/no-wallet';

export default function HistoryPage() {
  const { isConnected } = useAccount();
  const isSSR = useIsSSR();

  return (
    <Layout>
      <Head>
        <title>Administration</title>
        <meta
          name="description"
          content="Administration panel to manage role allocation"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {!isSSR && !isConnected && <NoWallet />}
      {!isSSR && isConnected && <History />}
    </Layout>
  );
}
