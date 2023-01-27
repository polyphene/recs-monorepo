import { DateTimeResolver, DateTimeTypeDefinition } from 'graphql-scalars';
import { makeExecutableSchema } from '@graphql-tools/schema';
import type { Event } from '@prisma/client';
import {GraphQLContext} from "../context";

const typeDefinitions = /* GraphQL */ `
  ${DateTimeTypeDefinition}

  type Query {
    user(id: ID!): Event
  }

  input Signature {
    signed: String!
    message: String!
  }

  type Event {
    id: ID!
    createdAt: DateTime!
  }
`;

const resolvers = {
  DateTime: DateTimeResolver,
  Query: {
    async user(
        parent: unknown,
        args: { id: string },
        context: GraphQLContext,
    ): Promise<Event | null> {
      return context.prisma.event.findUnique({
        where: { id: parseInt(args.id) },
      });
    },
  },
  Event: {
    id: (parent: Event) => parent.id,
    createdAt: (parent: Event) => parent.createdAt,
  },
};

export const schema = makeExecutableSchema({
  resolvers: [resolvers],
  typeDefs: [typeDefinitions],
});
