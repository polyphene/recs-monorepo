import { gql } from '@apollo/client';

export const ADD_METADATA = gql`
  mutation AddMetadata($input: AddMetadataInput!) {
    addMetadata(input: $input) {
      count
    }
  }
`;

export const METADATA_BY_CREATOR = gql`
  query MetadataByCreator($broker: String!) {
    metadataByCreator(broker: $broker) {
      cid
      country
      region
      reportingStart
      reportingEnd
      energySources
      volumeMWh
      minted
    }
  }
`;

export const METADATA_BY_CID = gql`
  query MetadataByCid($cid: String!) {
    metadataByCid(cid: $cid) {
      cid
      country
      region
      reportingStart
      reportingEnd
      energySources
      volumeMWh
      minted
    }
  }
`;

export const ROLES = gql`
  query Roles {
    roles {
      address
      isMinter
      isAdmin
      isRedeemer
    }
  }
`;

export const EVENTS_BY_TOKEN_ID = gql`
  query EventsByTokenId($tokenId: String!) {
    eventsByTokenId(tokenId: $tokenId) {
      blockHeight
      createdAt
      eventType
      id
      logIndex
      tokenId
      transactionHash
      data {
        ... on RoleEventData {
          __typename
          account
          sender
          role
        }
        ... on ListEventData {
          __typename
          price
          seller
          tokenAmount
          tokenId
        }
        ... on BuyEventData {
          __typename
          price
          buyer
          seller
          tokenAmount
          tokenId
        }
        ... on RedeemEventData {
          __typename
          amount
          owner
          tokenId
        }
        ... on TransferEventData {
          __typename
          from
          id
          operator
          to
          value
        }
      }
    }
  }
`;
