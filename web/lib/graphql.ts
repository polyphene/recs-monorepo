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
