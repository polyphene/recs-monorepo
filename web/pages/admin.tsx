import Head from 'next/head';
import { useAccount } from 'wagmi';

import useIsSSR from '@/lib/useIsSSR';
import { Admin } from '@/components/admin';
import { Layout } from '@/components/layout';
import { NoWallet } from '@/components/no-wallet';

export default function AdminPage() {
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
      {!isSSR && isConnected && <Admin />}
    </Layout>
  );
}
