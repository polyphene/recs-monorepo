import { SendTransactionResult } from '@wagmi/core';
import { ClassValue, clsx } from 'clsx';
import Papa from 'papaparse';
import { twMerge } from 'tailwind-merge';

import { ParsedMetadata } from '@/lib/storage';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const waitTx = async (
  promiseTxResult: Promise<SendTransactionResult>
): Promise<boolean> => {
  const txResult = await promiseTxResult;
  const txReceipt = await txResult.wait();
  return Boolean(txReceipt.status);
};

export const parseCSV = async (file: File): Promise<ParsedMetadata[]> => {
  let rows = [];
  return new Promise((resolve) => {
    Papa.parse(file, {
      worker: true,
      header: true,
      dynamicTyping: true,
      comments: '#',
      step: (row) => {
        rows.push(row.data);
      },
      complete: () => {
        resolve(rows);
      },
    });
  });
};

export const ADMIN_ROLE =
  '0x0000000000000000000000000000000000000000000000000000000000000000';
export const MINTER_ROLE =
  '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';
export const REDEEMER_ROLE =
  '0x44ac9762eec3a11893fefb11d028bb3102560094137c3ed4518712475b2577cc';
