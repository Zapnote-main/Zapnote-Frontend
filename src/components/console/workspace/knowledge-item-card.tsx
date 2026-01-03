"use client"

import { useState } from "react"
import { ExternalLink, MoreVertical, Calendar, Tag as TagIcon, MessageSquare, Loader2, Trash2, Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu"
import type { KnowledgeItem, ContentType } from "@/src/types/workspace"
import { cn } from "@/src/lib/utils"
import { useWorkspace } from "@/src/context/workspace-context"
import { toast } from "sonner"

interface KnowledgeItemCardProps {
  item: KnowledgeItem
}

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

export function KnowledgeItemCard({ item }: KnowledgeItemCardProps) {
  const router = useRouter()
  const { deleteKnowledgeItem } = useWorkspace()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteKnowledgeItem(item.workspaceId, item.id)
      toast.success("Item deleted successfully")
      setIsConfirmOpen(false)
    } catch (error) {
      toast.error("Failed to delete item")
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300 overflow-hidden relative z-0 hover:z-20 ml-2 mt-3 hover:ring-4 hover:ring-primary/10">
      <div className={cn("absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity", contentTypeColors[item.contentType].split(" ")[0].replace("/10", ""))} />
      <CardHeader className="p-4 pb-2 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-xs font-medium", contentTypeColors[item.contentType])}>
                {item.contentType}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>
            <a 
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block font-semibold hover:underline line-clamp-2 wrap-break-words text-base group-hover:text-primary transition-colors"
            >
              {item.summary || item.sourceUrl}
            </a>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              onClick={() => router.push(`/chat?context=${item.id}`)}
              title="Chat with this item"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem className="cursor-pointer">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer"
                  onClick={() => setIsConfirmOpen(true)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <a 
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:underline truncate flex items-center gap-1 bg-muted/30 p-1.5 rounded border border-transparent hover:border-border transition-colors"
        >
          <ExternalLink className="h-3 w-3 shrink-0" />
          {item.sourceUrl}
        </a>

        {item.userIntent && (
          <div className="text-sm bg-muted/50 p-2.5 rounded-md border border-transparent group-hover:border-border/50 transition-colors">
            <span className="font-medium text-xs text-muted-foreground block mb-1 uppercase tracking-wider">Intent</span>
            <p className="text-sm leading-relaxed">{item.userIntent}</p>
          </div>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {item.tags.map((tag) => {
               const label = typeof tag === 'string' ? tag : tag.name;
               const key = typeof tag === 'string' ? tag : tag.id;
               return (
                <Badge key={key} variant="secondary" className="text-xs px-2 py-0.5 bg-secondary/50 hover:bg-secondary transition-colors">
                  <TagIcon className="h-3 w-3 mr-1 opacity-70" />
                  {label}
                </Badge>
               )
            })}
          </div>
        )}
      </CardContent>
    
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete item</DialogTitle>
            <DialogDescription>Are you sure you want to delete this item? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
