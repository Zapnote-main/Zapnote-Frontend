"use client"

import * as React from "react"
import { formatDateRange } from "little-date"
import { PlusIcon, ExternalLink } from "lucide-react"

import { Button } from "@/src/components/ui/button"
import { Calendar } from "@/src/components/ui/calendar"
import { Card, CardContent, CardFooter } from "@/src/components/ui/card"

interface KnowledgeItem {
  id: string
  sourceUrl: string
  userIntent?: string
  summary?: string
  createdAt: string
  workspaceName: string
}

interface Calendar31Props {
  calendarData: Record<string, KnowledgeItem[]>
}

export default function Calendar31({ calendarData }: Calendar31Props) {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  const selectedDateKey = date?.toISOString().split('T')[0]
  const selectedDateItems = selectedDateKey ? calendarData[selectedDateKey] || [] : []

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="bg-transparent p-0"
          required
        />
      </div>
      <div className="flex flex-col items-start gap-3 border-t px-4 pt-4 mt-4">
        <div className="flex w-full items-center justify-between px-1">
          <div className="text-sm font-medium">
            {date?.toLocaleDateString("en-US", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
          <div className="text-xs text-muted-foreground">
            {selectedDateItems.length} bookmark{selectedDateItems.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 max-h-48 overflow-y-auto">
          {selectedDateItems.length === 0 ? (
            <p className="text-muted-foreground text-sm">No bookmarks on this date</p>
          ) : (
            selectedDateItems.map((item) => (
              <div
                key={item.id}
                className="bg-muted after:bg-primary/70 relative rounded-md p-2 pl-6 text-sm after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline line-clamp-1 flex items-center gap-1"
                    >
                      {item.summary || item.sourceUrl}
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                    <div className="text-muted-foreground text-xs mt-1">
                      {item.workspaceName}
                    </div>
                    {item.userIntent && (
                      <div className="text-muted-foreground text-xs mt-1 line-clamp-2">
                        {item.userIntent}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
