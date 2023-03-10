import { DateTimeResolver, DateTimeTypeDefinition } from 'graphql-scalars';
import { makeExecutableSchema } from '@graphql-tools/schema';
import type { Metadata } from '@prisma/client';
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
  }

  type Mutation {
    addMetadata(input: AddMetadataInput!): CountPayload!
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
