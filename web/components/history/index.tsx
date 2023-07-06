import { useState } from 'react';
import { useQuery } from '@apollo/client';

import { EVENTS_BY_TOKEN_ID } from '@/lib/graphql';
import { EventsTable } from '@/components/history/events';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export const History = () => {
  const [tokenId, setTokenId] = useState('');
  const [chain, setChain] = useState('filecoin');

  return (
    <section className="container grid items-center gap-6 pt-6 pb-8 md:py-10">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            History panel
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Inspect RECs collection history.
          </p>
        </div>
      </div>
      <Separator className="my-4" />
      <div className="flex">
        <Select
          onValueChange={(value) => {
            setChain(value);
          }}
          disabled={true}
          defaultValue={'filecoin'}
        >
          <SelectTrigger className="w-2/12">
            <SelectValue placeholder="Select a chain" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Chain</SelectLabel>
              <SelectItem value="ewc">Energy Web</SelectItem>
              <SelectItem value="filecoin">Filecoin</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Input
          id="token-id"
          placeholder="Token Id"
          className="ml-4 w-2/12"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
        />
      </div>
      <EventsTable chain={chain} tokenId={tokenId} />
    </section>
  );
};
