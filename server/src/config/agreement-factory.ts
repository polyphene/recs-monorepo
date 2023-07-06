export default {
    abi: [
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'agreementAddress',
                    type: 'address',
                },
                {
                    indexed: false,
                    internalType: 'bytes',
                    name: 'claimData',
                    type: 'bytes',
                },
            ],
            name: 'AgreementClaimed',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'agreementAddress',
                    type: 'address',
                },
                {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'certificateId',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                },
            ],
            name: 'AgreementFilled',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'agreementAddress',
                    type: 'address',
                },
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'buyer',
                    type: 'address',
                },
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'seller',
                    type: 'address',
                },
                {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                },
            ],
            name: 'AgreementSigned',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: false,
                    internalType: 'address[]',
                    name: 'agreements',
                    type: 'address[]',
                },
            ],
            name: 'AgreementsDeployed',
            type: 'event',
        },
        {
            inputs: [
                {
                    internalType: 'address',
                    name: '',
                    type: 'address',
                },
            ],
            name: 'agreementData',
            outputs: [
                {
                    internalType: 'address',
                    name: 'buyer',
                    type: 'address',
                },
                {
                    internalType: 'address',
                    name: 'seller',
                    type: 'address',
                },
                {
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                },
                {
                    internalType: 'bytes',
                    name: 'metadata',
                    type: 'bytes',
                },
                {
                    internalType: 'bool',
                    name: 'valid',
                    type: 'bool',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
    ],
};
