import * as React from 'react';
import { Dispatch, SetStateAction } from 'react';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function DateRangePicker({
  setDateRange,
  dateRange,
}: {
  setDateRange: Dispatch<SetStateAction<DateRange>> | undefined;
  dateRange: DateRange;
}) {
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);

  return (
    <div className={cn('grid gap-2')}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              (setDateRange ? !dateRange : !date) && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {(setDateRange ? dateRange?.from : date?.from) ? (
              (setDateRange ? dateRange.to : date.to) ? (
                <>
                  {format(
                    setDateRange ? dateRange.from : date.from,
                    'LLL dd, y'
                  )}{' '}
                  - {format(setDateRange ? dateRange.to : date.to, 'LLL dd, y')}
                </>
              ) : (
                format(setDateRange ? dateRange.from : date.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={setDateRange ? dateRange?.from : date?.from}
            selected={setDateRange ? dateRange : date}
            onSelect={setDateRange ? setDateRange : setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
