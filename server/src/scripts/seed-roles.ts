import { getEthHttpUriEnv, getRecMarketplaceAddressEnv } from '../utils/env';
import { ethers } from 'ethers';
import recMarketplaceConfig from '../config/rec-marketplace';

// This functions allows us to only keep a list of Role granted without duplicates.
//
// It has to be noted that there might be an unlikely possibility that the same event with the same arguments is
// generated twice in the same block and transaction. We will not handle this case in this implementation
function uniq(events: ethers.Event[]) {
  const seen: { [key: string]: boolean } = {};
  return events.filter(function (event) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    const k = `${event.blockHash}${event.transactionHash}${event.args?.role}${event.args?.account}${event.args?.sender}`;
    // eslint-disable-next-line no-prototype-builtins
    return seen.hasOwnProperty(k) ? false : (seen[k] = true);
  });
}
const main = async () => {
  const recMarketplaceAddress = getRecMarketplaceAddressEnv();
  const ethProvider = ethers.getDefaultProvider(getEthHttpUriEnv());
  console.log(getEthHttpUriEnv());
  const recMarketplace = new ethers.Contract(
    recMarketplaceAddress,
    recMarketplaceConfig.abi,
    ethProvider,
  );

  const events = await recMarketplace.queryFilter('RoleGranted', 89916);
  const eventsFiltered = uniq(events);
  eventsFiltered.forEach(e => {
    console.log(
      '------------------------------------------------------------------------------',
    );
    console.log(
      `event ${e.event ?? 'noEvent'} at block ${e.blockNumber} w/ block hash ${
        e.blockHash
      }`,
    );
    console.log(e.args?.role);
    console.log(e.args?.account);
    console.log(e.args?.sender);
    console.log(
      '------------------------------------------------------------------------------',
    );
  });
};

main().then(console.log).catch(console.log);
