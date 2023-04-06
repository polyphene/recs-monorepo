import { DateTimeResolver, DateTimeTypeDefinition } from 'graphql-scalars';
import { makeExecutableSchema } from '@graphql-tools/schema';
import type { AddressRoles, Metadata, Event } from '@prisma/client';
import { GraphQLContext } from '../context';
import { CID } from 'multiformats';
import { GraphQLError } from 'graphql/error';
import { isAddress } from 'ethers/lib/utils';

const typeDefinitions = /* GraphQL */ `
  ${DateTimeTypeDefinition}

  type Query {
    metadata(id: ID!): Metadata
    metadataByCreator(broker: String!): [Metadata!]!
    metadataByCid(cid: String!): Metadata
    roles: [AddressRoles!]!
    eventsByTokenId(tokenId: String!): [Event!]!
  }

  type Mutation {
    addMetadata(input: AddMetadataInput!): CountPayload!
  }

  type Event {
    id: ID!
    tokenId: String
    eventType: String!
    data: EventData!
    blockHeight: String!
    transactionHash: String!
    logIndex: Int!
    createdAt: DateTime!
  }

  union EventData =
      RoleEventData
    | TransferEventData
    | ListEventData
    | BuyEventData
    | RedeemEventData

  type RoleEventData {
    role: String!
    sender: String!
    account: String!
  }

  type TransferEventData {
    id: String!
    from: String!
    to: String!
    value: String!
    operator: String!
  }

  type ListEventData {
    tokenId: String!
    seller: String!
    tokenAmount: String!
    price: String!
  }

  type BuyEventData {
    buyer: String!
    price: String!
    seller: String!
    tokenId: String!
    tokenAmount: String!
  }

  type RedeemEventData {
    owner: String!
    amount: String!
    tokenId: String!
  }

  type AddressRoles {
    id: ID!
    address: String!
    isAdmin: Boolean!
    isMinter: Boolean!
    isRedeemer: Boolean!
    createdAt: DateTime!
  }

  type Metadata {
    id: ID!
    cid: String!
    contractId: String!
    productType: String!
    label: String!
    energySources: String!
    contractDate: String!
    deliveryDate: String!
    reportingStart: String!
    reportingEnd: String!
    sellerName: String!
    sellerAddress: String!
    country: String!
    region: String!
    volumeMWh: Int!
    createdBy: String!
    minted: Boolean!
    createdAt: DateTime!
  }

  input AddMetadataInput {
    metadata: [MetadataInput!]!
    broker: String!
  }

  input MetadataInput {
    cid: String!
    contractId: String!
    productType: String!
    label: String!
    energySources: String!
    contractDate: String!
    deliveryDate: String!
    reportingStart: String!
    reportingEnd: String!
    sellerName: String!
    sellerAddress: String!
    country: String!
    region: String!
    volumeMWh: Int!
  }

  type CountPayload {
    count: Int!
  }
`;

type MetadataInput = {
  cid: string;
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
  volumeMWh: number;
};

type RoleEventData = {
  role: string;
  sender: string;
  account: string;
};

type TransferEventData = {
  id: string;
  from: string;
  to: string;
  value: string;
  operator: string;
};

type ListEventData = {
  tokenId: string;
  seller: string;
  tokenAmount: string;
  price: string;
};

type BuyEventData = {
  buyer: string;
  price: string;
  seller: string;
  tokenId: string;
  tokenAmount: string;
};

type RedeemEventData = {
  owner: string;
  amount: string;
  tokenId: string;
};

const resolvers = {
  DateTime: DateTimeResolver,
  Metadata: {
    id: (parent: Metadata) => parent.id,
    cid: (parent: Metadata) => parent.cid,
    contractId: (parent: Metadata) => parent.contractId,
    productType: (parent: Metadata) => parent.productType,
    label: (parent: Metadata) => parent.label,
    energySources: (parent: Metadata) => parent.energySources,
    contractDate: (parent: Metadata) => parent.contractDate,
    deliveryDate: (parent: Metadata) => parent.deliveryDate,
    reportingStart: (parent: Metadata) => parent.reportingStart,
    reportingEnd: (parent: Metadata) => parent.reportingEnd,
    sellerName: (parent: Metadata) => parent.sellerName,
    sellerAddress: (parent: Metadata) => parent.sellerAddress,
    country: (parent: Metadata) => parent.country,
    region: (parent: Metadata) => parent.region,
    volumeMWh: (parent: Metadata) => parent.volumeMWh,
    createdBy: (parent: Metadata) => parent.createdBy,
    createdAt: (parent: Metadata) => parent.createdAt,
  },
  EventData: {
    __resolveType(obj: { role: any; to: any; buyer: any; owner: any }) {
      if (obj.role) {
        return 'RoleEventData';
      }

      if (obj.to) {
        return 'TransferEventData';
      }

      if (obj.buyer) {
        return 'BuyEventData';
      }

      if (obj.owner) {
        return 'RedeemEventData';
      }

      return 'ListEventData';
    },
  },
  Query: {
    async metadata(
      parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ): Promise<Metadata | null> {
      return context.prisma.metadata.findUnique({
        where: { id: parseInt(args.id) },
      });
    },
    async metadataByCreator(
      parent: unknown,
      { broker }: { broker: string },
      context: GraphQLContext,
    ): Promise<Array<Metadata>> {
      // Check broker input
      if (!isAddress(broker)) {
        return Promise.reject(
          new GraphQLError('Invalid broker input', {
            extensions: {
              code: 'BAD_REQUEST',
            },
          }),
        );
      }

      return context.prisma.metadata.findMany({
        where: { createdBy: broker },
      });
    },
    async metadataByCid(
      parent: unknown,
      args: { cid: string },
      context: GraphQLContext,
    ): Promise<Metadata | null> {
      return context.prisma.metadata.findFirst({
        where: { cid: args.cid },
      });
    },
    async roles(
      parent: unknown,
      args: unknown,
      context: GraphQLContext,
    ): Promise<Array<AddressRoles>> {
      return context.prisma.addressRoles.findMany({
        where: {},
      });
    },
    async eventsByTokenId(
      parent: unknown,
      { tokenId }: { tokenId: string },
      context: GraphQLContext,
    ): Promise<Array<Event>> {
      return context.prisma.event.findMany({
        where: { tokenId },
      });
    },
  },
  Mutation: {
    async addMetadata(
      parent: unknown,
      {
        input: { metadata, broker },
      }: { input: { metadata: MetadataInput[]; broker: string } },
      context: GraphQLContext,
    ): Promise<{ count: number }> {
      for (const m of metadata) {
        // Check CID input
        try {
          CID.parse(m.cid);
        } catch (e) {
          return Promise.reject(
            new GraphQLError(
              `Invalid CID input for metadata at index ${metadata.indexOf(m)}`,
              {
                extensions: {
                  code: 'BAD_REQUEST',
                },
              },
            ),
          );
        }
      }

      // Check broker input
      if (!isAddress(broker)) {
        return Promise.reject(
          new GraphQLError('Invalid broker input', {
            extensions: {
              code: 'BAD_REQUEST',
            },
          }),
        );
      }

      return await context.prisma.metadata
        .createMany({
          data: metadata.map(m => {
            return {
              ...m,
              createdBy: broker,
              minted: false,
            };
          }),
        })
        .catch(() => {
          return Promise.reject(
            new GraphQLError("Couldn't create Metadata object", {
              extensions: {
                code: 'INTERNAL_SERVER_ERROR',
              },
            }),
          );
        });
    },
  },
};

export const schema = makeExecutableSchema({
  resolvers: [resolvers],
  typeDefs: [typeDefinitions],
});
