export default {
  abi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'batchId',
          type: 'bytes32',
        },
        {
          indexed: false,
          internalType: 'string',
          name: 'redemptionStatement',
          type: 'string',
        },
        {
          indexed: false,
          internalType: 'string',
          name: 'storagePointer',
          type: 'string',
        },
      ],
      name: 'RedemptionStatementSet',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'batchId',
          type: 'bytes32',
        },
        {
          indexed: false,
          internalType: 'uint256[]',
          name: 'certificateIds',
          type: 'uint256[]',
        },
      ],
      name: 'CertificateBatchMinted',
      type: 'event',
    },
  ],
};
