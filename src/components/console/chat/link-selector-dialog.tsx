"use client"

import { useState, useEffect } from "react"
import { Search, ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog"
import { Input } from "@/src/components/ui/input"
import { Badge } from "@/src/components/ui/badge"
import { LoaderThree } from "@/src/components/ui/loader"
import { useWorkspace } from "@/src/context/workspace-context"
import type { KnowledgeItem } from "@/src/types/workspace"
import { cn } from "@/src/lib/utils"

interface LinkSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (items: KnowledgeItem[]) => void
  workspaceId: string
  multiSelect?: boolean
}

export function LinkSelectorDialog({
  open,
  onOpenChange,
  onSelect,
  workspaceId,
  multiSelect = false,
}: LinkSelectorDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(false)
  const { recentItems, refreshRecentItems } = useWorkspace()

  useEffect(() => {
    if (open && workspaceId) {
      setLoading(true)
      refreshRecentItems(workspaceId).finally(() => setLoading(false))
    }
  }, [open, workspaceId, refreshRecentItems])

  useEffect(() => {
    setItems(recentItems)
  }, [recentItems])

  const filteredItems = items.filter((item) =>
    item.sourceUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.userIntent?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleItemClick = (item: KnowledgeItem) => {
    if (multiSelect) {
      const newSelected = new Set(selectedItems)
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id)
      } else {
        newSelected.add(item.id)
      }
      setSelectedItems(newSelected)
    } else {
      onSelect([item])
      onOpenChange(false)
    }
  }

  const handleConfirm = () => {
    if (multiSelect) {
      const selected = items.filter((item) => selectedItems.has(item.id))
      onSelect(selected)
      onOpenChange(false)
      setSelectedItems(new Set())
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Links</DialogTitle>
          <DialogDescription>
            Choose links to attach to your message
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-75 max-h-100 border rounded-md">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <LoaderThree />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
              <p className="text-sm">No links found</p>
              {searchQuery && <p className="text-xs mt-1">Try a different search term</p>}
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {filteredItems.map((item) => {
                const isSelected = selectedItems.has(item.id)
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {item.contentType}
                          </Badge>
                          {item.status === "COMPLETED" && (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400">
                              Ready
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">
                          {item.summary || item.sourceUrl}
                        </p>
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:underline flex items-center gap-1 mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          {item.sourceUrl}
                        </a>
                        {item.userIntent && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                            {item.userIntent}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {multiSelect && selectedItems.size > 0 && (
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">
              {selectedItems.size} link{selectedItems.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
            >
              Attach Selected
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}