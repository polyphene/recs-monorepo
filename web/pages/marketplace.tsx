import Head from 'next/head';
import { useAccount } from 'wagmi';

import useIsSSR from '@/lib/useIsSSR';
import { Layout } from '@/components/layout';
import { Marketplace } from '@/components/marketplace/index';
import { NoWallet } from '@/components/no-wallet';

export default function MarketplacePage() {
  const { isConnected } = useAccount();
  const isSSR = useIsSSR();

  return (
    <Layout>
      <Head>
        <title>Marketplace</title>
        <meta name="description" content="Marketplace to list and buy RECs" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {!isSSR && !isConnected && <NoWallet />}
      {!isSSR && isConnected && <Marketplace />}
    </Layout>
  );
}
