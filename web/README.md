## Renewable Energy Certificates Web

This sub-folder contains the codebase for the interface of the RECs marketplace application.

## Development

Before starting development process, you need to ensure that you have a proper [RECs Marketplace server](https://github.com/polyphene/recs-monorepo/tree/main/server)
running and accessible.

Then, create an `env.local` file containing the necessary environment variables:
- `NEXT_PUBLIC_REC_MARKETPLACE_ADDRESS`: Address where the RECMarketplace contract is deployed.
- `NEXT_PUBLIC_APOLLO_URI`: URL on which the GraphQL server is accessible.
- `NEXT_PUBLIC_WEB3_STORAGE_KEY`: API token to access the [web3.storage](https://web3.storage/) API.

Finally, you can jump into development by running:
```shell
npm run dev
```

The marketplace interface should now be accessible through http://localhost:3000
