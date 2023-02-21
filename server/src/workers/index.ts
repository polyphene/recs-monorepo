import * as ethers from 'ethers';
import { getEthWssUriEnv, getRecMarketplaceAddressEnv } from '../utils/env';
import recMarketplace from '../config/rec-marketplace';

export const startWorkers = () => {
  const recMarketplaceAddress = getRecMarketplaceAddressEnv();

  const provider = new ethers.WebSocketProvider(getEthWssUriEnv());
  console.log(getEthWssUriEnv());
  const contract = new ethers.Contract(
    recMarketplaceAddress,
    recMarketplace.abi,
    provider,
  );
  contract.on('TransferSingle', args => {
    console.log(args);
  });
};
