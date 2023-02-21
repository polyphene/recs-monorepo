import { DateTimeResolver, DateTimeTypeDefinition } from 'graphql-scalars';
import { makeExecutableSchema } from '@graphql-tools/schema';
import type { Metadata } from '@prisma/client';
import { GraphQLContext } from '../context';
import { CID } from 'multiformats';
import { GraphQLError } from 'graphql/error';

const typeDefinitions = /* GraphQL */ `
  ${DateTimeTypeDefinition}

  type Query {
    metadata(id: ID!): Metadata
  }

  type Mutation {
    addMetadata(input: AddMetadataInput!): Metadata!
  }

  type Metadata {
    id: ID!
    cid: String!
    createdBy: String!
    createdAt: DateTime!
  }

  input AddMetadataInput {
    cid: String!
    signedCid: String!
  }
`;

const resolvers = {
  DateTime: DateTimeResolver,
  Metadata: {
    id: (parent: Metadata) => parent.id,
    cid: (parent: Metadata) => parent.cid,
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
  },
  Mutation: {
    async addMetadata(
      parent: unknown,
      {
        input: { cid, signedCid },
      }: { input: { cid: string; signedCid: string } },
      context: GraphQLContext,
    ): Promise<Metadata> {
      try {
        const parsedCid = CID.parse(cid);
        console.log(parsedCid);
      } catch {
        return Promise.reject(
          new GraphQLError('Invalid CID input', {
            extensions: {
              code: 'BAD_REQUEST',
            },
          }),
        );
      }

      return {
        id: 1,
        cid: 'aa',
        createdBy: 'aa',
        createdAt: new Date(),
      };
    },
  },
};

export const schema = makeExecutableSchema({
  resolvers: [resolvers],
  typeDefs: [typeDefinitions],
});
