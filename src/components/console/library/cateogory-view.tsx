"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, ExternalLink, MessageSquare, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/motion-tab"
import { Card, CardContent, CardHeader } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { useWorkspace } from "@/src/context/workspace-context"
import { knowledgeApi } from "@/src/lib/api/knowledge"
import type { KnowledgeItem, ContentType } from "@/src/types/workspace"
import { cn } from "@/src/lib/utils"

const CONTENT_TYPES: ContentType[] = [
  "ARTICLE",
  "VIDEO",
  "AUDIO",
  "SOCIAL POST",
  "OTHER"
]

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

export default function CategoryView() {
  const router = useRouter()
  const { workspaces } = useWorkspace()
  const [selectedType, setSelectedType] = useState<ContentType>("ARTICLE")
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(false)


  const loadItems = useCallback(async (type: ContentType) => {
    if (workspaces.length === 0) return

    setLoading(true)
    try {
      const allItems: KnowledgeItem[] = []
      await Promise.all(workspaces.map(async (ws) => {
          try {
            const response = await knowledgeApi.getItems(ws.id, {
                type,
                limit: 50,
                page: 1
            })
            allItems.push(...response.data)
          } catch (e) {
              console.error(e)
          }
      }))
      
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
    if (selectedType) {
      loadItems(selectedType)
    }
  }, [workspaces, selectedType, loadItems])

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

  return (
    <div className="space-y-6">

      <div className="w-full">
        <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as ContentType)} className="w-full">
          <TabsList
            className="w-full justify-between bg-muted/50 p-1 border rounded-lg"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          >
            {CONTENT_TYPES.map((type) => (
              <TabsTrigger key={type} value={type} className="capitalize flex-1">
                {type.toLowerCase()}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <p>No {selectedType.toLowerCase()} items found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <Card key={item.id} className="group hover:shadow-lg transition-all">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="outline" className={cn("text-xs", contentTypeColors[item.contentType])}>
                          {item.contentType}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleChatClick(item)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
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
                          {item.tags.slice(0, 3).map((tag, idx) => {
                            const label = typeof tag === 'string' ? tag : tag.name
                            const key = typeof tag === 'string' ? `${tag}-${idx}` : tag.id
                            return (
                              <Badge key={key} variant="secondary" className="text-xs">
                                {label}
                              </Badge>
                            )
                          })}
                          {item.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{item.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
            )}
        </div>
      </div>
    </div>
  )
}