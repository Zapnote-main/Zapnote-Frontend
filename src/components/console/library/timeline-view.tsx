"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, ExternalLink, MessageSquare } from "lucide-react"
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

interface GroupedItems {
  [key: string]: KnowledgeItem[]
}

export default function TimelineView() {
  const router = useRouter()
  const { workspaces } = useWorkspace()
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [groupedItems, setGroupedItems] = useState<GroupedItems>({})

  const loadItems = useCallback(async () => {
    if (workspaces.length === 0) return

    setLoading(true)
    try {
      const allItems: KnowledgeItem[] = []
      
      await Promise.all(
        workspaces.map(async (workspace) => {
          try {
            const response = await knowledgeApi.getItems(workspace.id, {
              limit: 100,
              page: 1
            })
            allItems.push(...response.data)
          } catch (error) {
            console.error(`Failed to load items for workspace ${workspace.id}:`, error)
          }
        })
      )
      
      allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setItems(allItems)
    } catch (error) {
      console.error("Failed to load items:", error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [workspaces])

  const groupItemsByDate = useCallback((items: KnowledgeItem[]) => {
    const groups: GroupedItems = {}
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)
    const lastMonth = new Date(today)
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    items.forEach(item => {
      const itemDate = new Date(item.createdAt)
      let groupKey = ''

      if (itemDate.toDateString() === today.toDateString()) {
        groupKey = 'Today'
      } else if (itemDate.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday'
      } else if (itemDate > lastWeek) {
        groupKey = 'Last 7 days'
      } else if (itemDate > lastMonth) {
        groupKey = 'Last month'
      } else {
        const month = itemDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        groupKey = month
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(item)
    })

    setGroupedItems(groups)
  }, [])

  useEffect(() => {
    loadItems()
  }, [workspaces, loadItems])

  useEffect(() => {
    groupItemsByDate(items)
  }, [items, groupItemsByDate])

  const handleChatClick = (item: KnowledgeItem) => {
    router.push(`/chat?workspaceId=${item.workspaceId}&sourceItemId=${item.id}&type=link`)
  }

  if (workspaces.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No workspaces found</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const groupOrder = ['Today', 'Yesterday', 'Last 7 days', 'Last month']
  const sortedKeys = Object.keys(groupedItems).sort((a, b) => {
    const indexA = groupOrder.indexOf(a)
    const indexB = groupOrder.indexOf(b)
    if (indexA !== -1 && indexB !== -1) return indexA - indexB
    if (indexA !== -1) return -1
    if (indexB !== -1) return 1
    return b.localeCompare(a)
  })

  return (
    <div className="space-y-6">

      {items.length === 0 ? (
        <Card className="h-96 flex items-center justify-center">
          <CardContent>
            <p className="text-muted-foreground">No items found in your library</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sortedKeys.map(groupKey => (
            <div key={groupKey} className="space-y-4">
              <div className="py-2 border-b">
                <h2 className="text-xl font-semibold">{groupKey}</h2>
                <p className="text-sm text-muted-foreground">{groupedItems[groupKey].length} items</p>
              </div>

              <div className="space-y-4">
                {groupedItems[groupKey].map(item => (
                  <Card key={item.id} className="group hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={cn("text-xs", contentTypeColors[item.contentType])}>
                                {item.contentType}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(item.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleChatClick(item)}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>

                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium hover:underline line-clamp-2 flex items-start gap-1"
                          >
                            {item.summary || item.sourceUrl}
                            <ExternalLink className="h-3 w-3 mt-0.5 shrink-0" />
                          </a>

                          {item.userIntent && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {item.userIntent}
                            </p>
                          )}

                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.tags.slice(0, 5).map((tag, idx) => {
                                const label = typeof tag === 'string' ? tag : tag.name
                                const key = typeof tag === 'string' ? `${tag}-${idx}` : tag.id
                                return (
                                  <Badge key={key} variant="secondary" className="text-xs">
                                    {label}
                                  </Badge>
                                )
                              })}
                              {item.tags.length > 5 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{item.tags.length - 5}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}