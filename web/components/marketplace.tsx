import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Separator} from "@/components/ui/separator";

export function Marketplace() {

  return (
    <section className="container grid items-center gap-6 pt-6 pb-8 md:py-10">
      <Tabs defaultValue="buy" className="h-full space-y-6">
        <div className="space-between flex flex-col">
          <TabsList className="w-fit">
            <TabsTrigger value="buy" className="relative">
              Buy
            </TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
          <TabsContent value="buy" className="border-none p-0">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Buy RECs
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Browse listed RECs. Redeem for green energy.
                </p>
              </div>
            </div>
            <Separator className="my-4" />
          </TabsContent>
          <TabsContent value="list" className="border-none p-0">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">
                  List RECs
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  List minted RECs. Share your green energy.
                </p>
              </div>
            </div>
            <Separator className="my-4" />
          </TabsContent>
        </div>
      </Tabs>
    </section>
  )
}



