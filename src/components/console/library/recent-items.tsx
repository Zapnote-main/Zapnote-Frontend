"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, ExternalLink, MessageSquare, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { useWorkspace } from "@/src/context/workspace-context"
import { knowledgeApi } from "@/src/lib/api/knowledge"
import type { KnowledgeItem, ContentType } from "@/src/types/workspace"
import { cn } from "@/src/lib/utils"

const contentTypeColors: Record<ContentType, string> = {
  ARTICLE: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  VIDEO: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  AUDIO: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  "SOCIAL POST": "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20",
  IMAGE: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  DOCUMENT: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  CODE: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
  OTHER: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
}

export default function RecentView() {
  const router = useRouter()
  const { workspaces } = useWorkspace()
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(false)

  const loadItems = useCallback(async () => {
    if (workspaces.length === 0) return

    setLoading(true)
    try {
      const allItems: KnowledgeItem[] = []
      
      await Promise.all(
        workspaces.map(async (workspace) => {
          try {
            const response = await knowledgeApi.getItems(workspace.id, {
              limit: 50,
              page: 1
            })
            allItems.push(...response.data)
          } catch (error) {
            console.error(`Failed to load items for workspace ${workspace.id}:`, error)
          }
        })
      )

      const sortedItems = allItems.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setItems(sortedItems)
    } catch (error) {
      console.error("Failed to load items:", error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [workspaces])

  useEffect(() => {
    loadItems()
  }, [workspaces, loadItems])

  const handleChatClick = (item: KnowledgeItem) => {
    router.push(`/chat?workspaceId=${item.workspaceId}&sourceItemId=${item.id}&type=link`)
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return date.toLocaleDateString()
  }

  if (workspaces.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No workspaces found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={loadItems}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <Card className="h-96 flex items-center justify-center">
          <CardContent>
            <p className="text-muted-foreground">No items found in your library</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <Card key={item.id} className="group hover:shadow-lg transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {index + 1}
                  </div>

                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={cn("text-xs", contentTypeColors[item.contentType])}>
                        {item.contentType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {getRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:underline line-clamp-2 flex items-start gap-1 group"
                    >
                      {item.summary || item.sourceUrl}
                      <ExternalLink className="h-3 w-3 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>

                    {item.userIntent && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        <span className="font-medium">Intent:</span> {item.userIntent}
                      </p>
                    )}

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 4).map((tag, idx) => {
                          const label = typeof tag === 'string' ? tag : tag.name
                          const key = typeof tag === 'string' ? `${tag}-${idx}` : tag.id
                          return (
                            <Badge key={key} variant="secondary" className="text-xs">
                              {label}
                            </Badge>
                          )
                        })}
                        {item.tags.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{item.tags.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 Sshrink-0"
                    onClick={() => handleChatClick(item)}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}