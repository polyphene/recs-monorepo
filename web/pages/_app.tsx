import type {AppProps} from "next/app"
import {Inter as FontSans} from "@next/font/google"
import {ThemeProvider} from "next-themes"

import "@/styles/globals.css"
import {configureChains, createClient, WagmiConfig} from "wagmi"
import {filecoinHyperspace} from "wagmi/chains"
import {InjectedConnector} from 'wagmi/connectors/injected'
import {publicProvider} from 'wagmi/providers/public'
import {jsonRpcProvider} from "wagmi/providers/jsonRpc"
import {ToastContainer} from "react-toastify"
import 'react-toastify/dist/ReactToastify.css'
import {ApolloClient, ApolloProvider, InMemoryCache} from "@apollo/client";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

/********************************
 * Wagmi Config
 * ********************************/

// Configure chains & providers with the Alchemy provider.
// Two popular providers are Alchemy (alchemy.com) and Infura (infura.io)
const {chains, provider, webSocketProvider} = configureChains(
  [filecoinHyperspace],
  [jsonRpcProvider({
    priority: 0,
    rpc: (chain) => ({
      http: `https://api.hyperspace.node.glif.io/rpc/v1`,
      webSocket: `wss://wss.hyperspace.node.glif.io/apigw/lotus/rpc/v1`,
    }),
  }), publicProvider()],
)


// Set up client
const wagmiClient = createClient({
  autoConnect: true,
  connectors: [
    new InjectedConnector({
      chains,
      options: {
        name: 'Injected',
        shimDisconnect: true,
      },
    }),
  ],
  provider,
  webSocketProvider,
})

/********************************
 * Apollo Config
 * ********************************/

const apolloClient = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_APOLLO_URI,
  cache: new InMemoryCache(),
});


export default function App({Component, pageProps}: AppProps) {
  return (
    <>
      <style jsx global>{`
        :root {
          --font-sans: ${fontSans.style.fontFamily};
        }

        }`}</style>
      <ApolloProvider client={apolloClient}>
        <WagmiConfig client={wagmiClient}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Component {...pageProps} />
            <ToastContainer/>
          </ThemeProvider>
        </WagmiConfig></ApolloProvider>
    </>
  )
}
