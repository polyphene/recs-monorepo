import { DateTimeResolver, DateTimeTypeDefinition } from 'graphql-scalars';
import { makeExecutableSchema } from '@graphql-tools/schema';
import type { User, Metadata, Event, Prisma, Collection, Balance, Listing } from '@prisma/client';
import { GraphQLContext } from '../context';
import { CID } from 'multiformats';
import { GraphQLError } from 'graphql/error';
import { isAddress } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';

const typeDefinitions = /* GraphQL */ `
    ${DateTimeTypeDefinition}

    type Query {
        metadata(id: ID!): Metadata
        metadataByCid(cid: String!): Metadata
        filteredMetadata(where: FilterMetadataInput!): [Metadata!]!
        users: [User!]!
        filteredUsers(where: FilterUserInput!): [User!]!
        eventsByTokenId(tokenId: String!): [Event!]!
        filteredCollections(where: FilterCollectionInput!): [Collection!]!
        bridgedCollections: [Collection!]!
        filteredListings(where: FilterListingInput!): [Listing!]!
    }

    type Mutation {
        addMetadata(input: AddMetadataInput!): CountPayload!
    }

    type Collection {
        id: ID!
        filecoinTokenId: String
        energyWebTokenIds: [String!]!
        events: [Event!]!
        balances: [Balance!]!
        redeemedVolume: String
        metadata: Metadata
        redemptionStatement: String
        createdAt: DateTime!
    }

    input FilterCollectionInput {
        filecoinTokenId: String
        energyWebTokenId: String
        createdBy: String
    }

    type Event {
        id: ID!
        collection: Collection
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
        | EwcRedemptionSetEventData
        | EwcClaimEventData
        | RedemptionStatementSet

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

    type EwcRedemptionSetEventData {
        batchId: String!
        redemptionStatement: String!
        storagePointer: String!
    }

    type EwcClaimEventData {
        _claimIssuer: String!
        _claimSubject: String!
        _topic: String!
        _id: String!
        _value: String!
        _claimData: String!
    }

    type RedemptionStatementSet {
        minter: String!
        tokenId: String!
        cid: String!
    }

    type User {
        id: ID!
        balances: [Balance!]!
        address: String!
        isAdmin: Boolean!
        isMinter: Boolean!
        isRedeemer: Boolean!
        createdAt: DateTime!
    }

    input FilterUserInput {
        address: String
    }

    type Balance {
        id: ID!
        user: User!
        collection: Collection!
        amount: String!
        redeemed: String!
    }

    type Listing {
        id: ID!
        seller: User!
        sellerAddress: String!
        buyer: User
        buyerAddress: String
        collectionId: Collection!
        collection: Collection
        amount: String!
        unitPrice: String!
    }

    input FilterListingInput {
        sellerAddress: String
        buyerAddress: String
        isSold: Boolean
    }

    type Metadata {
        id: ID!
        collection: Collection
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
        volume: String!
        createdBy: String!
        minted: Boolean!
        createdAt: DateTime!
    }

    input FilterMetadataInput {
        broker: String
        minted: Boolean
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
        volume: String!
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
    volume: string;
};

const resolvers = {
    DateTime: DateTimeResolver,
    Collection: {
        id: (parent: Collection) => parent.id,
        filecoinTokenId: (parent: Collection) => parent.filecoinTokenId,
        energyWebTokenIds: (parent: Collection) => parent.energyWebTokenIds,
        events(parent: Collection, args: Record<string, never>, context: GraphQLContext) {
            return context.prisma.event.findMany({
                where: {
                    collectionId: parent.id,
                },
            });
        },
        balances(parent: Collection, args: Record<string, never>, context: GraphQLContext) {
            return context.prisma.balance.findMany({
                where: {
                    collectionId: parent.id,
                },
            });
        },
        metadata(parent: Collection, args: Record<string, never>, context: GraphQLContext) {
            if (!parent.metadataId) {
                return null;
            }
            return context.prisma.metadata.findUnique({
                where: {
                    id: parent.metadataId,
                },
            });
        },
        async redeemedVolume(parent: Collection, args: Record<string, never>, context: GraphQLContext) {
            const balances = await context.prisma.balance.findMany({
                where: {
                    collectionId: parent.id,
                },
            });

            const initialValue = BigNumber.from('0');
            const redeemedAmount = balances.reduce(
                (accumulator, currentValue) => accumulator.add(BigNumber.from(currentValue.redeemed)),
                initialValue,
            );

            return redeemedAmount.toString();
        },
        redemptionStatement: (parent: Collection) => parent.redemptionStatement,
        createdAt: (parent: Collection) => parent.createdAt,
    },
    Metadata: {
        id: (parent: Metadata) => parent.id,
        collection(parent: Metadata, args: Record<string, never>, context: GraphQLContext) {
            return context.prisma.collection.findUnique({
                where: {
                    metadataId: parent.id,
                },
            });
        },
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
        volume: (parent: Metadata) => parent.volume,
        createdBy: (parent: Metadata) => parent.createdBy,
        createdAt: (parent: Metadata) => parent.createdAt,
    },
    EventData: {
        __resolveType(obj: {
            role: any;
            to: any;
            buyer: any;
            owner: any;
            _claimData: any;
            storagePointer: any;
            cid: any;
        }) {
            if (obj.cid) {
                return 'RedemptionStatementSet';
            }
            if (obj.storagePointer) {
                return 'EwcRedemptionSetEventData';
            }

            if (obj._claimData) {
                return 'EwcClaimEventData';
            }

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
    Event: {
        id: (parent: Event) => parent.id,
        collection(parent: Event, args: Record<string, never>, context: GraphQLContext) {
            if (!parent.collectionId) {
                return null;
            }
            return context.prisma.collection.findUnique({
                where: {
                    id: parent.collectionId,
                },
            });
        },
        tokenId: (parent: Event) => parent.tokenId,
        eventType: (parent: Event) => parent.eventType,
        data: (parent: Event) => parent.data,
        blockHeight: (parent: Event) => parent.blockHeight,
        transactionHash: (parent: Event) => parent.transactionHash,
        logIndex: (parent: Event) => parent.logIndex,
        createdAt: (parent: Event) => parent.createdAt,
    },
    User: {
        id: (parent: User) => parent.id,
        balances(parent: User, args: Record<string, never>, context: GraphQLContext) {
            return context.prisma.balance.findMany({
                where: {
                    userAddress: parent.address,
                },
            });
        },
        address: (parent: User) => parent.address,
        isAdmin: (parent: User) => parent.isAdmin,
        isMinter: (parent: User) => parent.isMinter,
        isRedeemer: (parent: User) => parent.isRedeemer,
        createdAt: (parent: User) => parent.createdAt,
    },
    Balance: {
        id: (parent: Balance) => parent.id,
        user(parent: Balance, args: Record<string, never>, context: GraphQLContext) {
            return context.prisma.user.findFirst({
                where: {
                    address: parent.userAddress,
                },
            });
        },
        collection(parent: Balance, args: Record<string, never>, context: GraphQLContext) {
            return context.prisma.collection.findFirst({
                where: {
                    id: parent.collectionId,
                },
            });
        },
        amount: (parent: Balance) => parent.amount,
        redeemed: (parent: Balance) => parent.redeemed,
    },
    Listing: {
        id: (parent: Listing) => parent.id,
        seller(parent: Listing, args: Record<string, never>, context: GraphQLContext) {
            return context.prisma.user.findFirst({
                where: {
                    address: parent.sellerAddress,
                },
            });
        },
        sellerAddress: (parent: Listing) => parent.sellerAddress,
        buyer(parent: Listing, args: Record<string, never>, context: GraphQLContext) {
            if (!parent.buyerAddress) {
                return null;
            }
            return context.prisma.user.findFirst({
                where: {
                    address: parent.buyerAddress,
                },
            });
        },
        buyerAddress: (parent: Listing) => parent.buyerAddress,
        collection(parent: Listing, args: Record<string, never>, context: GraphQLContext) {
            return context.prisma.collection.findFirst({
                where: {
                    id: parent.collectionId,
                },
            });
        },
        collectionId: (parent: Listing) => parent.collectionId,
        amount: (parent: Listing) => parent.amount,
        unitPrice: (parent: Listing) => parent.unitPrice,
    },
    Query: {
        async metadata(parent: unknown, args: { id: string }, context: GraphQLContext): Promise<Metadata | null> {
            return context.prisma.metadata.findUnique({
                where: { id: parseInt(args.id) },
            });
        },
        async filteredMetadata(
            parent: unknown,
            { where: { broker, minted } }: { where: { broker: string | null; minted: boolean | null } },
            context: GraphQLContext,
        ): Promise<Array<Metadata>> {
            // Check broker input
            if (broker && !isAddress(broker)) {
                return Promise.reject(
                    new GraphQLError('Invalid broker input', {
                        extensions: {
                            code: 'BAD_REQUEST',
                        },
                    }),
                );
            }

            const findFilter: Prisma.MetadataFindManyArgs = {
                include: { collection: true },
                where: {
                    createdBy: broker || undefined,
                },
            };
            switch (minted) {
                case true:
                    findFilter.where = {
                        NOT: { collection: { filecoinTokenId: null } },
                        ...findFilter.where,
                    };
                    break;
                case false:
                    findFilter.where = {
                        collection: { filecoinTokenId: null },
                        ...findFilter.where,
                    };
                    break;
                default:
                    findFilter.where = {
                        ...findFilter.where,
                    };
                    break;
            }

            return context.prisma.metadata.findMany(findFilter);
        },
        async metadataByCid(parent: unknown, args: { cid: string }, context: GraphQLContext): Promise<Metadata | null> {
            return context.prisma.metadata.findFirst({
                where: { cid: args.cid },
            });
        },
        async users(parent: unknown, args: unknown, context: GraphQLContext): Promise<Array<User>> {
            return context.prisma.user.findMany({
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
        async filteredUsers(
            parent: unknown,
            { where: { address } }: { where: { address: string | null } },
            context: GraphQLContext,
        ): Promise<Array<User>> {
            const findFilter: Prisma.UserFindManyArgs = {
                include: { balances: true },
                where: {
                    address: address || undefined,
                },
            };

            return context.prisma.user.findMany(findFilter);
        },
        async filteredCollections(
            parent: unknown,
            {
                where: { filecoinTokenId, energyWebTokenId, createdBy },
            }: { where: { filecoinTokenId: string | null; energyWebTokenId: string | null; createdBy: string | null } },
            context: GraphQLContext,
        ): Promise<Array<Collection>> {
            const findFilter: Prisma.CollectionFindManyArgs = {
                include: { metadata: true, events: true },
                where: {
                    filecoinTokenId: filecoinTokenId || undefined,
                    energyWebTokenIds: energyWebTokenId ? { has: energyWebTokenId } : undefined,
                    metadata: {
                        createdBy: createdBy ? createdBy : undefined,
                    },
                },
            };

            return context.prisma.collection.findMany(findFilter);
        },
        async bridgedCollections(
            parent: unknown,
            args: Record<string, never>,
            context: GraphQLContext,
        ): Promise<Array<Collection>> {
            const findFilter: Prisma.CollectionFindManyArgs = {
                include: { metadata: true, events: true },
                where: {
                    NOT: {
                        energyWebTokenIds: { isEmpty: false },
                    },
                },
            };

            return context.prisma.collection.findMany(findFilter);
        },
        async filteredListings(
            parent: unknown,
            {
                where: { sellerAddress, buyerAddress, isSold },
            }: { where: { sellerAddress: string | null; buyerAddress: string | null; isSold: boolean | null } },
            context: GraphQLContext,
        ): Promise<Array<Listing>> {
            const findFilter: Prisma.ListingFindManyArgs = {
                include: { seller: true, buyer: true, collection: true },
                where: {
                    sellerAddress: sellerAddress || undefined,
                    buyerAddress: isSold ? (buyerAddress ? buyerAddress : undefined) : undefined,
                },
            };

            return context.prisma.listing.findMany(findFilter);
        },
    },
    Mutation: {
        async addMetadata(
            parent: unknown,
            { input: { metadata, broker } }: { input: { metadata: MetadataInput[]; broker: string } },
            context: GraphQLContext,
        ): Promise<{ count: number }> {
            for (const m of metadata) {
                // Check CID input
                try {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                    CID.parse(m.cid);
                } catch (e) {
                    return Promise.reject(
                        new GraphQLError(`Invalid CID input for metadata at index ${metadata.indexOf(m)}`, {
                            extensions: {
                                code: 'BAD_REQUEST',
                            },
                        }),
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

            const results = await Promise.all(
                metadata.map(m =>
                    context.prisma.metadata.create({
                        data: {
                            ...m,
                            createdBy: broker,
                            minted: false,
                            collection: {
                                create: {
                                    filecoinTokenId: null,
                                    energyWebTokenIds: [],
                                },
                            },
                        },
                    }),
                ),
            );

            return { count: results.length };
        },
    },
};

export const schema = makeExecutableSchema({
    resolvers: [resolvers],
    typeDefs: [typeDefinitions],
});
