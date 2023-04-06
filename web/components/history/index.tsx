import { useState } from 'react';
import { useQuery } from '@apollo/client';

import { EVENTS_BY_TOKEN_ID } from '@/lib/graphql';
import { EventsTable } from '@/components/history/events';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export const History = () => {
  const [tokenId, setTokenId] = useState('');

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
      <Input
        id="token-id"
        placeholder="Token Id"
        className="w-2/12"
        value={tokenId}
        onChange={(e) => setTokenId(e.target.value)}
      />
      <EventsTable tokenId={tokenId} />
    </section>
  );
};
