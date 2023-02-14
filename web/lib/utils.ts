import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import {SendTransactionResult} from "@wagmi/core";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const waitTx = async (promiseTxResult: Promise<SendTransactionResult>): Promise<boolean> => {
  const txResult = await promiseTxResult;
  const txReceipt = await txResult.wait();
  return Boolean(txReceipt.status);
}
