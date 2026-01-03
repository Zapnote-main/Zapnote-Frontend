"use client"

import { MessageSquare, Trash2, Clock } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet"
import { Button } from "@/src/components/ui/button"
import { LoaderThree } from "@/src/components/ui/loader"
import type { Conversation } from "@/src/types/chat.types"
import { cn } from "@/src/lib/utils"

interface ChatHistoryDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversations: Conversation[]
  activeConversationId?: string
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  loading?: boolean
}

export function ChatHistoryDrawer({
  open,
  onOpenChange,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  loading = false,
}: ChatHistoryDrawerProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else if (diffInHours < 168) {
      return date.toLocaleDateString(undefined, { weekday: 'short' })
    } else {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }
  }

  const groupedConversations = conversations.reduce((acc, conv) => {
    const date = new Date(conv.createdAt)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let group = 'Older'
    if (date.toDateString() === today.toDateString()) {
      group = 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      group = 'Yesterday'
    } else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      group = 'Last 7 days'
    }

    if (!acc[group]) acc[group] = []
    acc[group].push(conv)
    return acc
  }, {} as Record<string, Conversation[]>)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-100 sm:w-135">
        <SheetHeader>
          <SheetTitle>Chat History</SheetTitle>
          <SheetDescription>
            View and manage your previous conversations
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoaderThree />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start chatting to see your history</p>
            </div>
          ) : (
            Object.entries(groupedConversations).map(([group, convs]) => (
              <div key={group}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">
                  {group}
                </h3>
                <div className="space-y-1">
                  {convs.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => {
                        onSelectConversation(conv.id)
                        onOpenChange(false)
                      }}
                      className={cn(
                        "group flex items-start justify-between gap-3 p-3 rounded-lg cursor-pointer transition-all",
                        activeConversationId === conv.id
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted border border-transparent"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <p className="text-sm font-medium truncate">
                            {conv.title}
                          </p>
                        </div>
                        {conv.lastMessage && (
                          <p className="text-xs text-muted-foreground line-clamp-2 ml-6">
                            {conv.lastMessage}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 ml-6">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatDate(conv.updatedAt)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteConversation(conv.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}