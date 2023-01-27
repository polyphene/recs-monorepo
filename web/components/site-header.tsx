import Link from "next/link"
import { siteConfig } from "@/config/site"

import { Icons } from "@/components/icons"
import { MainNav } from "@/components/main-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import {Button, buttonVariants} from "@/components/ui/button"
import {Separator} from "@/components/ui/separator";
import {useTheme} from "next-themes";
import {useAccount, useConnect} from "wagmi";
import {useEffect} from "react";
import {toast} from "react-toastify";
import useIsSSR from "@/lib/useIsSSR";

export function SiteHeader() {
  const { theme } = useTheme();
  const {address, isConnected} = useAccount()
  const isSSR = useIsSSR();

  const { connect, connectors, error } =
    useConnect()

  useEffect(() => {
    if(error !== null) {
      toast.error(`Error while connecting to wallet.`, { theme })
    }
  }, [error?.message]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-b-slate-200 bg-white dark:border-b-slate-700 dark:bg-slate-900">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <MainNav items={siteConfig.mainNav} />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            {
              !isSSR && isConnected && <p className="text-sm text-slate-700 dark:text-slate-400">
                {address.substring(0, 6)} ... {address.substring(address.length-5, address.length-1)}
              </p>
            }
            {
              !isSSR && !isConnected && connectors.map((connector) => {
                return <Button
                  key={connector.id}
                  onClick={() => {
                    connect({ connector })
                  }}
                >
                  Connect wallet
                </Button>
              })
            }
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
            >
              <div
                className={buttonVariants({
                  size: "sm",
                  variant: "ghost",
                  className: "text-slate-700 dark:text-slate-400",
                })}
              >
                <Icons.gitHub className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </div>
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}
