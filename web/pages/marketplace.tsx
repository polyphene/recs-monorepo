import Head from "next/head"

import {NoWallet} from "@/components/no-wallet";
import {Layout} from "@/components/layout"
import {useAccount} from "wagmi";
import {Dashboard} from "@/components/dashboard";
import useIsSSR from "@/lib/useIsSSR";

export default function IndexPage() {
  const {isConnected} = useAccount()
  const isSSR = useIsSSR();

  return (
    <Layout>
      <Head>
        <title>Dashboard</title>
        <meta
          name="description"
          content="Dashboard to manage RECs"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link rel="icon" href="/favicon.ico"/>
      </Head>
      {
        !isSSR && !isConnected && <NoWallet/>
      }
      {
        !isSSR && isConnected && <Dashboard/>
      }
    </Layout>
  )
}
