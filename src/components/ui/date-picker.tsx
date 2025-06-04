
import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  mode?: "single" | "range"
  selected?: Date | DateRange | undefined
  onSelect?: (date: Date | DateRange | undefined) => void
  className?: string
  children?: React.ReactNode
  defaultMonth?: Date
}

export function DatePicker({
  mode = "single",
  selected,
  onSelect,
  className,
  children,
  defaultMonth
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children || (
          <Button
            variant={"outline"}
            className={cn(
              "justify-start text-left font-normal",
              !selected && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selected ? (
              mode === "range" && selected && typeof selected === "object" && "from" in selected ? (
                selected.to ? (
                  `${format(selected.from, "MMM dd, yyyy")} - ${format(selected.to, "MMM dd, yyyy")}`
                ) : (
                  format(selected.from, "MMM dd, yyyy")
                )
              ) : selected instanceof Date ? (
                format(selected, "MMM dd, yyyy")
              ) : (
                <span>Pick a date</span>
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode={mode as any}
          selected={selected}
          onSelect={onSelect}
          defaultMonth={defaultMonth}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
