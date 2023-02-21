'use client';

import { useState } from 'react';
import { Check, MousePointerClick, Wand2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

import { parseCSV } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type Allocation = {
  address: string;
  amount: number;
  redeem: boolean;
};

export function MintRECs() {
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    maxFiles: 1,
  });
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-fit">
          <Wand2 className="mr-1" />
          Parse Metadata
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload RECs Metadata</DialogTitle>
          <DialogDescription>
            Upload RECs metadata to mint them later.
          </DialogDescription>
        </DialogHeader>
        <div
          {...getRootProps({ className: 'dropzone' })}
          className="flex h-[300px] shrink-0 items-center justify-center rounded-md border border-dashed border-slate-200 dark:border-slate-700"
        >
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <input {...getInputProps()} />
            {acceptedFiles.length > 0 && (
              <>
                <Check />
                <p className="mt-2 mb-4 text-sm font-medium">
                  {acceptedFiles[0].name.substring(
                    0,
                    acceptedFiles[0].name.length - 4
                  )}
                </p>
              </>
            )}
            {acceptedFiles.length === 0 && (
              <>
                <MousePointerClick />
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Upload your Metadata file
                </h3>
                <p className="mt-2 mb-4 text-sm text-slate-500 dark:text-slate-400">
                  Upload your CSV file here!
                </p>
              </>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={acceptedFiles.length === 0}
            onClick={async () => {
              console.log(acceptedFiles[0]);
              console.log(await parseCSV(acceptedFiles[0]));
            }}
          >
            Parse
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
