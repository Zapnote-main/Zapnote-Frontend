"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { ChatInterface } from "@/src/components/console/chat/chat-interface"
import { LoaderThree } from "@/src/components/ui/loader"
import { useWorkspace } from "@/src/context/workspace-context"
import { chatApi } from "@/src/lib/api/chat"
import type { ChatContextType } from "@/src/types/chat.types"
import { toast } from "sonner"

export default function ChatConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = use(params)
  const router = useRouter()
  const { currentWorkspace } = useWorkspace()

  const [chatContext, setChatContext] = useState<ChatContextType | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadConversation = async () => {
      if (!currentWorkspace) {
        router.push("/home")
        return
      }

      setIsLoading(true)

      try {
        const conversation = await chatApi.getConversation(
          currentWorkspace.id,
          conversationId
        )

        // Determine context type based on conversation
        const context: ChatContextType = {
          type: conversation.sourceItemId ? "link" : "workspace",
          workspaceId: conversation.workspaceId || currentWorkspace.id,
          sourceItemId: conversation.sourceItemId,
        }

        setChatContext(context)
      } catch (error) {
        console.error("Failed to load conversation:", error)
        toast.error("Failed to load conversation")
        router.push("/chat")
      } finally {
        setIsLoading(false)
      }
    }

    loadConversation()
  }, [conversationId, currentWorkspace, router])

  if (isLoading || !chatContext) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderThree />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/chat")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="flex-1 min-h-0">
        <ChatInterface
          workspaceId={chatContext.workspaceId}
          sourceItemId={chatContext.sourceItemId}
          conversationId={conversationId}
          chatContext={chatContext}
        />
      </div>
    </div>
  )
}