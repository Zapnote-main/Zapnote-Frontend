"use client"

import { useState } from "react"
import { Copy, ExternalLink, Tag as TagIcon } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { toast } from "sonner"
import { Streamdown } from "streamdown"
import type { Message } from "@/src/types/chat.types"
import { cn } from "@/src/lib/utils"

interface ChatMessageProps {
  message: Message
  isStreaming?: boolean
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === "user"
  
  const displayContent = message.content

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayContent || "")
      setCopied(true)
      toast.success("Copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy")
    }
  }

  if (isUser) {
    return (
      <div className="flex justify-end w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl px-4 py-3 shadow-sm">
          <p className="whitespace-pre-wrap leading-relaxed text-sm">
            {message.content}
          </p>
          {message.sourceItemIds && message.sourceItemIds.length > 0 && (
            <div className="mt-2 pt-2 border-t border-primary-foreground/20">
              <p className="text-xs opacity-70 mb-1">Context from:</p>
              <div className="flex flex-wrap gap-1">
                {message.sources?.map((source) => (
                  <a
                    key={source.id}
                    href={source.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs opacity-90 hover:opacity-100 underline flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                    {source.summary || 'Link'}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full relative group animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="w-full text-foreground p-4 relative">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <Streamdown>{displayContent || ""}</Streamdown>
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <TagIcon className="h-3 w-3" />
              Sources referenced:
            </p>
            <div className="space-y-2">
              {message.sources.map((source) => (
                <a
                  key={source.id}
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-xs p-2 rounded bg-background/50 hover:bg-background transition-colors group/source"
                >
                  <ExternalLink className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground group-hover/source:text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{source.summary || 'Link'}</p>
                    <p className="text-muted-foreground truncate">{source.sourceUrl}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleCopy}
          >
            <Copy className={cn("h-4 w-4", copied && "text-green-500")} />
          </Button>
        </div>
      </div>
    </div>
  )
}