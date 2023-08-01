import { useEffect, useState } from 'react';
import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { DateRange } from 'react-day-picker';

import { FILTERED_LISTINGS } from '@/lib/graphql';
import { BuyRecsTable } from '@/components/marketplace/buy-recs';
import { ListRecsTable } from '@/components/marketplace/list-recs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function Marketplace() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isPolling, setIsPolling] = useState(false);
  const [country, setCountry] = useState<string | undefined>(undefined);
  const [availableCountries, setAvailableCountries] = useState<Array<string>>(
    []
  );

  const { loading, error, data, startPolling } = useQuery(FILTERED_LISTINGS, {
    variables: { where: { isSold: false } },
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    if (!isPolling && startPolling) {
      startPolling(5000);
      setIsPolling(true);
    }
  }, [startPolling, isPolling]);

  useEffect(() => {
    const tpmAvailableCountries = [];
    data?.filteredListings.forEach((l) => {
      tpmAvailableCountries.push(l.collection.metadata.country);
    });
    setAvailableCountries(tpmAvailableCountries);
  }, [data]);

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
            <div className="mb-3 flex items-center">
              <DateRangePicker
                setDateRange={setDateRange}
                dateRange={dateRange}
              />
              <Select onValueChange={(v) => setCountry(v)}>
                <SelectTrigger className="ml-2 w-1/5">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  {availableCountries.map((c) => {
                    return <SelectItem value={c}>{c}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <BuyRecsTable
              limitDateRange={dateRange}
              country={country}
              loading={loading}
              error={error}
              listings={
                data?.filteredListings.length > 0 ? data.filteredListings : []
              }
            />
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
            <ListRecsTable />
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
}
