import { SendTransactionResult } from '@wagmi/core';
import { ClassValue, clsx } from 'clsx';
import Papa from 'papaparse';
import { twMerge } from 'tailwind-merge';

import { Metadata } from '@/lib/storage';

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

export const parseCSV = async (file: File): Promise<Metadata[]> => {
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
