import * as process from 'process';
import { apolloClient } from '@/pages/_app';
import { CarReader } from '@ipld/car';
import { Block } from '@ipld/car/api';
import * as cbor from '@ipld/dag-cbor';
import { encode } from 'multiformats/block';
import { sha256 } from 'multiformats/hashes/sha2';
import { CIDString, Web3Storage } from 'web3.storage';

import { ADD_METADATA, FILTERED_METADATA } from '@/lib/graphql';

export type ParsedMetadata = {
  contract_id: string;
  productType: string;
  label: string;
  energySources: string;
  contractDate: string;
  deliveryDate: string;
  reportingStart: string;
  reportingEnd: string;
  sellerName: string;
  sellerAddress: string;
  country: string;
  region: string;
  volume_MWh: number;
};

export type Metadata = {
  contractId: string;
  productType: string;
  label: string;
  energySources: string;
  contractDate: string;
  deliveryDate: string;
  reportingStart: string;
  reportingEnd: string;
  sellerName: string;
  sellerAddress: string;
  country: string;
  region: string;
  volume: number;
};

export type MetadataUpload = {
  broker: string;
  uploadDate: string;
  metadata: Metadata[];
};

type EncodedMetadata = {
  root: Block;
  blocks: Block[];
};

const encodeCborBlock = (value: unknown) => {
  return encode({ value, codec: cbor, hasher: sha256 });
};

const makeCar = (rootCID, ipldBlocks) => {
  return new CarReader(1, [rootCID], ipldBlocks);
};

const encodeMetadataCbor = async (
  metadata: Metadata
): Promise<{ root: Block; blocks: Block[] }> => {
  let metadataBlocks: Block[] = [];
  let linkedMetadata: object = {};

  // Encode broker to get its CID
  for (const [key, value] of Object.entries(metadata)) {
    const valueBlock = await encodeCborBlock(value);
    linkedMetadata[key] = valueBlock.cid;
    metadataBlocks.push(valueBlock);
  }

  const linkedMetadataBlock = await encodeCborBlock(linkedMetadata);

  return { root: linkedMetadataBlock, blocks: metadataBlocks };
};

export const store = async (
  broker: string,
  metadata: Metadata[]
): Promise<CIDString> => {
  const encodedMetadata: EncodedMetadata[] = await Promise.all(
    metadata.map(async (m) => await encodeMetadataCbor(m))
  );

  // Encode broker to get its CID
  const brokerBlock = await encodeCborBlock(broker);

  // Encode timestamp to get its CID
  const dateBlock = await encodeCborBlock(new Date().getTime());

  // Now we can use the CID to link to the object from another object
  const metadataUploadBlock = await encodeCborBlock({
    broker: brokerBlock.cid,
    uploadDate: dateBlock.cid,
    metadata: [encodedMetadata.map((m) => m.root.cid)],
  });

  // pack everything into a CAR
  const car = await makeCar(metadataUploadBlock.cid, [
    ...encodedMetadata.flatMap((m) => [m.root, ...m.blocks]),
    brokerBlock,
    dateBlock,
    metadataUploadBlock,
  ]);

  // upload to web3.storage using putCar
  const client = new Web3Storage({
    token: process.env.NEXT_PUBLIC_WEB3_STORAGE_KEY,
  });

  const cid = await client.putCar(car);

  // Upload information on our server
  await apolloClient.mutate({
    mutation: ADD_METADATA,
    variables: {
      input: {
        metadata: encodedMetadata.map((m, i) => {
          return {
            cid: m.root.cid.toString(),
            ...metadata[i],
            volume: metadata[i].volume.toString(),
          };
        }),
        broker,
      },
    },
    refetchQueries: [
      {
        query: FILTERED_METADATA,
        variables: { where: { broker, minted: false } },
      }, // DocumentNode object parsed with gql
      'MetadataByCreator', // Query name
    ],
  });

  return cid;
};
