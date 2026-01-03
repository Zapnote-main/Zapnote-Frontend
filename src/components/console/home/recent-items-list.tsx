"use client"

import { ExternalLink, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react"
import { Badge } from "@/src/components/ui/badge"
import type { KnowledgeItem } from "@/src/types/workspace"
import { cn } from "@/src/lib/utils"

interface RecentItemsListProps {
  items: KnowledgeItem[]
}

const statusConfig = {
  PENDING: { icon: Clock, color: "text-yellow-600 dark:text-yellow-400", label: "Pending" },
  PROCESSING: { icon: Loader2, color: "text-blue-600 dark:text-blue-400 animate-spin", label: "Processing" },
  COMPLETED: { icon: CheckCircle2, color: "text-green-600 dark:text-green-400", label: "Completed" },
  FAILED: { icon: XCircle, color: "text-red-600 dark:text-red-400", label: "Failed" },
}

const contentTypeColors = {
  ARTICLE: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  VIDEO: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  DOCUMENT: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  IMAGE: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  OTHER: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
}

export function RecentItemsList({ items }: RecentItemsListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No recent items yet</p>
        <p className="text-xs mt-1">Add your first link to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const StatusIcon = statusConfig[item.status].icon
        
        return (
          <div
            key={item.id}
            className="group p-4 rounded-lg border bg-card hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <StatusIcon className={cn("h-4 w-4 shrink-0", statusConfig[item.status].color)} />
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline truncate flex items-center gap-1"
                >
                  {item.summary || item.sourceUrl}
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
              <Badge variant="outline" className={cn("text-xs shrink-0", contentTypeColors[item.contentType])}>
                {item.contentType}
              </Badge>
            </div>

            {item.userIntent && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                <span className="font-medium">Intent:</span> {item.userIntent}
              </p>
            )}

            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.tags.slice(0, 3).map((tag) => {
                  const label = typeof tag === 'string' ? tag : tag.name;
                  const key = typeof tag === 'string' ? tag : tag.id;
                  return (
                    <Badge key={key} variant="secondary" className="text-xs">
                      {label}
                    </Badge>
                  );
                })}
                {item.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{item.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
              <span>
                {new Date(item.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className={statusConfig[item.status].color}>
                {statusConfig[item.status].label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}