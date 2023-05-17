import { CarReader } from '@ipld/car';
import * as cbor from '@ipld/dag-cbor';
import { encode } from 'multiformats/block';
import { sha256 } from 'multiformats/hashes/sha2';
import { CIDString, Web3Storage } from 'web3.storage';

import { getWeb3StorageKeyEnv } from './env';

export const store = async (data: string): Promise<CIDString> => {
    // Encode broker to get its CID
    const dataBlock = await encode({ value: data, codec: cbor, hasher: sha256 });

    // pack everything into a CAR
    const car = new CarReader(1, [dataBlock.cid], [dataBlock]);

    // upload to web3.storage using putCar
    const client = new Web3Storage({
        token: getWeb3StorageKeyEnv(),
    });

    const cid = await client.putCar(car);

    return cid;
};
