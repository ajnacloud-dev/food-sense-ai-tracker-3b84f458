
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface DateRangeFilterProps {
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange: (startDate?: Date, endDate?: Date) => void;
}

export const DateRangeFilter = ({ startDate, endDate, onDateRangeChange }: DateRangeFilterProps) => {
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);

  const quickFilters = [
    { label: 'Today', onClick: () => {
      const today = new Date();
      onDateRangeChange(today, today);
    }},
    { label: 'This Week', onClick: () => {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      onDateRangeChange(weekStart, today);
    }},
    { label: 'This Month', onClick: () => {
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      onDateRangeChange(monthStart, today);
    }},
    { label: 'All Time', onClick: () => onDateRangeChange(undefined, undefined) }
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Date Range:</span>
        
        <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "MMM dd, yyyy") : "Start date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(date) => {
                onDateRangeChange(date, endDate);
                setIsStartOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <span className="text-sm text-gray-500">to</span>

        <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "MMM dd, yyyy") : "End date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={(date) => {
                onDateRangeChange(startDate, date);
                setIsEndOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex gap-1">
        {quickFilters.map((filter) => (
          <Button
            key={filter.label}
            variant="outline"
            size="sm"
            onClick={filter.onClick}
            className="text-xs"
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
