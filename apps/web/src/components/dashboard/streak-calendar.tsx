"use client";

import { useMemo, useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StreakCalendarProps {
  achievementDates: string[];
}

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function StreakCalendar({ achievementDates }: StreakCalendarProps) {
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const claimedDates = useMemo(
    () => new Set(achievementDates),
    [achievementDates],
  );

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth();

  const previousMonth = () => {
    setCurrentMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    if (isCurrentMonth) {
      return;
    }

    setCurrentMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  };

  const getDateKey = (day: number) => {
    const monthValue = String(month + 1).padStart(2, "0");
    const dayValue = String(day).padStart(2, "0");

    return `${year}-${monthValue}-${dayValue}`;
  };

  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  return (
    <div className="w-full">
      {/* Calendar */}
      <div className="">
        <div className="mb-3 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={previousMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {monthLabel}
          </h3>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={nextMonth}
            disabled={isCurrentMonth}
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* Days headings */}
        <div className="grid grid-cols-7 text-center">
          {DAYS.map((day, index) => (
            <div
              key={`${day}-${index}`}
              className="text-[10px] font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dateKey = getDateKey(day);
            const claimed = claimedDates.has(dateKey);
            const todaysDate = isToday(day);

            return (
              <div
                key={dateKey}
                className="flex pb-1 items-center justify-center"
              >
                <div
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-medium transition-colors
                        ${claimed ? "bg-green-600 border border-green-600 text-white" : "text-gray-600 dark:text-gray-300"}
                        ${todaysDate && !claimed ? "border border-primary text-primary" : ""}`}
                  title={
                    claimed
                      ? "Achievement claimed"
                      : todaysDate
                        ? "Today"
                        : undefined
                  }
                >
                  {day}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-4 border-t pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-green-500 border border-green-600" />
            Claimed
          </div>

          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full border border-primary" />
            Today
          </div>
        </div>
      </div>
    </div>
  );
}
