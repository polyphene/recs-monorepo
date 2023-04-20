import { useQuery } from '@apollo/client';
import { BigNumber } from 'ethers';
import { useAccount, useContractRead, useContractReads } from 'wagmi';

import recMarketplace from '@/config/rec-marketplace';
import { METADATA_BY_CID } from '@/lib/graphql';
import { BuyRecs } from '@/components/buy-recs-dialog';

type TokenListing = {
  tokenId: number;
  seller: string;
  tokenAmount: BigNumber;
  price: BigNumber;
};

function BuyRecsRow({ listing }: { listing: TokenListing }) {
  const { address } = useAccount();

  // @ts-ignore
  const {
    data: onChainData,
    isError: onChainDataError,
    isLoading: onchainDataLoading,
  }: {
    data:
      | [
          BigNumber,
          BigNumber,
          BigNumber,
          string,
          Array<{ tokenAmount: BigNumber }>
        ]
      | null;
    isError: boolean;
    isLoading;
    boolean;
  } = useContractReads({
    contracts: [
      // @ts-ignore
      {
        ...recMarketplace,
        functionName: 'balanceOf',
        args: [listing.seller, listing.tokenId],
      },
      // @ts-ignore
      {
        ...recMarketplace,
        functionName: 'uri',
        args: [listing.tokenId],
      },
      // @ts-ignore
      {
        ...recMarketplace,
        functionName: 'tokenSupplyListed',
        args: [listing.tokenId],
      },
    ],
    watch: true,
  });

  const {
    data,
    loading: metadataLoading,
    error: metadataError,
  } = useQuery(METADATA_BY_CID, {
    variables: { cid: onChainData?.[1] ?? '' },
  });

  if (
    onChainDataError ||
    onchainDataLoading ||
    onChainData?.[0].toString() === '0' ||
    metadataLoading ||
    metadataError ||
    !data?.metadataByCid
  )
    return <></>;

  return (
    <tr className="m-0 border-t border-slate-200 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {listing.tokenId.toString()}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {data.metadataByCid.country}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {data.metadataByCid.region}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {data.metadataByCid.reportingStart}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {data.metadataByCid.reportingEnd}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {listing.seller}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        <a
          className="underline hover:no-underline"
          href={`https://explore.ipld.io/#/explore/${onChainData?.[1].toString()}`}
          target="_blank"
          rel="noreferrer"
        >
          {onChainData?.[1].toString().substring(0, 14)}...
          {onChainData?.[1]
            .toString()
            .substring(
              onChainData?.[1].toString().length - 14,
              onChainData?.[1].toString().length
            )}
        </a>
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        {onChainData[2].toString() ?? '0'}
      </td>
      <td className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
        <BuyRecs
          id={listing.tokenId.toString()}
          seller={listing.seller}
          price={listing.price}
        />
      </td>
    </tr>
  );
}

export function BuyRecsTable() {
  const {
    data,
    isLoading,
    isError,
  }: {
    data: Array<TokenListing>;
    isLoading: boolean;
    isError: boolean;
  } = useContractRead(
    // @ts-ignore
    {
      ...recMarketplace,
      functionName: 'currentTokenListings',
      watch: true,
    }
  );

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Couldn&apos;t fetch next REC id</p>;
  if (data.length === 0) return <p>No RECs in sale</p>;

  return (
    <table className="w-full">
      <thead>
        <tr className="m-0 border-t border-slate-300 p-0 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Id
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Country
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Region
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Reporting Start
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Reporting End
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Broker
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Cid
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Currently Listed
          </th>
          <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((e) => {
          return (
            <BuyRecsRow
              listing={e}
              key={`${e.seller}${e.tokenId.toString()}`}
            />
          );
        })}
      </tbody>
    </table>
  );
}
