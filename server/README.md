## Renewable Energy Certificates server

This sub-folder contains the codebase for the server-side logic of the RECs marketplace application.

## Development

To ease development, a dedicated `docker-compose.yml` was created. This will however require developers to have both 
`docker` and `docker-compose` installed on their machine.

To start developing you will first need to deploy a new instance of RECMarketplace on your network of choice. We will by
default consider that Hyperspace is the network of development. To deploy the contract over this network please see the
[contracts repository README](https://github.com/polyphene/recs-contract#deployment).

Once the contract deployed, find the block height of the transaction over an explorer (e.g.: [Filfox](https://hyperspace.filfox.info/en))
and update the environment variables `REC_MARKETPLACE_ADDRESS` and `DEPLOYMENT_BLOCK_HEIGHT` in the `docker-compose.yml`
file.

Once this is done, start the container:
```shell
docker-compose up 
```

Once the start up process is complete, you should be able to access the GraphQL interface at http://localhost:4000/graphql

## Environment variable

For the server to be able to start up, a few environment variables have to be set:
- `PORT`: Port through which the GraphQL server will be accessible.
- `NODE_ENV`: Node environment that the server is booting up on.
- `DATABASE_URL`: Database URL that the server will use to store data.
- `ETH_WSS_URI`: Public filecoin node WS access point.
- `ETH_HTTP_URI`: Public filecoin node HTTP access point.
- `REC_MARKETPLACE_ADDRESS`: Address where the RECMarketplace contract is deployed.
- `DEPLOYMENT_BLOCK_HEIGHT`: Block when the RECMarketplace contract was deployed. Used once at the first start of the server,
to ensure we do not miss any role related event to seed in the database.

## Energy Web Chain

We are seeding deployed contract over filecoin with data coming from the Energy Web Chain. There are a few things to know
when it comes to that bridge:
1. The amount of RECs minted and claimed on Energy Web Chain and bridged to Filecoin will differ as **Certificate collection
1 and 2 do not have any redemption statement set**.
2. The amount of RECs minted and claimed is different on the Energy Web Chain. Currently the difference is of 524,257 MWh.
With 239216 MWh minted and 238691,743 MWh claimed.  