"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChatMessage } from "./chat-message"
import { ChatHistoryDrawer } from "./chat-history-drawer"
import { Reasoning, ReasoningTrigger, ReasoningContent } from "../chat/reasoning"
import AI_Prompt from "./ai-prompt"
import GeminiLogo from "@/src/components/console/chat/gemini-logo"
import { chatApi } from "@/src/lib/api/chat"
import { useWorkspace } from "@/src/context/workspace-context"
import { useSidebar } from "@/src/components/ui/sidebar"
import { useAuth } from "@/src/context/auth-context"
import { motion } from "motion/react"
import { useChatUI } from "@/src/context/chat-ui-context"
import type { Conversation, Message, ChatContextType } from "@/src/types/chat.types"
import { toast } from "sonner"
import { useRevealedMessage } from "@/src/hooks/use-revealed-message"

interface ChatInterfaceProps {
  workspaceId?: string
  sourceItemId?: string
  conversationId?: string
  chatContext: ChatContextType
}

/**
 * Places a persisted message into the list without ever producing a duplicate id.
 *
 * `replaceId` is the optimistic placeholder to swap out. If the real message is
 * somehow already present (a refetch or another tab got there first) it is updated
 * in place instead of appended, since two children with the same key is both a React
 * warning and a source of duplicated bubbles.
 */
function commitMessage(list: Message[], message: Message, replaceId?: string): Message[] {
  const existingIndex = list.findIndex((m) => m.id === message.id)

  if (existingIndex !== -1) {
    const updated = list.map((m, i) => (i === existingIndex ? message : m))
    return replaceId ? updated.filter((m) => m.id !== replaceId) : updated
  }

  if (replaceId) {
    const placeholderIndex = list.findIndex((m) => m.id === replaceId)
    if (placeholderIndex !== -1) {
      return list.map((m, i) => (i === placeholderIndex ? message : m))
    }
  }

  return [...list, message]
}

export function ChatInterface({
  workspaceId,
  sourceItemId,
  conversationId: initialConversationId,
  chatContext,
}: ChatInterfaceProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversationId || null
  )
  const [messages, setMessages] = useState<Message[]>([])
  const { isHistoryOpen, setIsHistoryOpen } = useChatUI()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)
  const [isThinking, setIsThinking] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const { revealing, reveal, cancel: cancelReveal } = useRevealedMessage()

  const { currentWorkspace } = useWorkspace()
  const { state } = useSidebar()
  const { user } = useAuth()
  const router = useRouter()

  const sidebarWidth = state === "expanded" ? "16rem" : "3rem"
  const rightMargin = state === "expanded" ? "16rem" : "3rem"
  const username = user?.displayName || user?.email?.split('@')[0] || "User"

  const effectiveWorkspaceId = workspaceId || currentWorkspace?.id

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    if (!effectiveWorkspaceId) return

    const loadConversations = async () => {
      setIsLoadingConversations(true)
      try {
        const convs = await chatApi.getConversations(effectiveWorkspaceId)
        setConversations(convs)

        if (initialConversationId) {
          const conv = await chatApi.getConversation(
            effectiveWorkspaceId,
            initialConversationId
          )
          setMessages(conv.messages || [])
        }
      } catch (error) {
        console.error("Failed to load conversations:", error)
        toast.error("Failed to load conversation history")
      } finally {
        setIsLoadingConversations(false)
      }
    }

    loadConversations()
  }, [effectiveWorkspaceId, initialConversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages, revealing, scrollToBottom])

  const handleSendMessage = async (content: string, sourceItemIds?: string[]) => {
    if (!effectiveWorkspaceId) {
      toast.error("No workspace selected")
      return
    }

    const effectiveSourceItemIds = sourceItemIds || (sourceItemId ? [sourceItemId] : undefined)

    let convId: string = activeConversationId || ""

    if (!convId) {
      try {
        const title = content.length > 50 ? `${content.slice(0, 50)}...` : content
        const newConv = await chatApi.createConversation(effectiveWorkspaceId, {
          title,
          workspaceId: effectiveWorkspaceId,
          sourceItemId: sourceItemId,
        })

        convId = newConv.id
        setActiveConversationId(convId)
        setConversations((prev) => [newConv, ...prev])
      } catch (error) {
        console.error("Failed to create conversation:", error)
        toast.error("Failed to create conversation")
        return
      }
    }

    const tempUserMessage: Message = {
      id: `temp-user-${Date.now()}`,
      conversationId: convId,
      role: "user",
      content,
      sourceItemIds: effectiveSourceItemIds,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, tempUserMessage])
    setIsLoading(true)
    setIsThinking(true)

    try {
      const { userMessage, assistantMessage } = await chatApi.sendMessage(
        effectiveWorkspaceId,
        convId,
        { message: content, sourceItemIds: effectiveSourceItemIds }
      )

      setIsThinking(false)

      // Swap the optimistic message for the persisted one so it carries a real id.
      setMessages((prev) => commitMessage(prev, userMessage, tempUserMessage.id))

      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                lastMessage: assistantMessage.content,
                updatedAt: assistantMessage.createdAt,
              }
            : c
        )
      )

      // Reveal the reply, then commit it to the list. No refetch: the response
      // already contains everything the list needs.
      await reveal(assistantMessage)
      setMessages((prev) => commitMessage(prev, assistantMessage))
      cancelReveal()
    } catch (error) {
      console.error("Failed to send message:", error)
      toast.error("Failed to send message")

      cancelReveal()
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
    } finally {
      setIsLoading(false)
      setIsThinking(false)
    }
  }

  const handleSelectConversation = async (id: string) => {
    if (!effectiveWorkspaceId) return

    cancelReveal()
    setActiveConversationId(id)
    setIsLoading(true)

    try {
      const conv = await chatApi.getConversation(effectiveWorkspaceId, id)
      setMessages(conv.messages || [])

      const params = new URLSearchParams()
      if (conv.workspaceId) params.set("workspaceId", conv.workspaceId)
      if (conv.sourceItemId) {
        params.set("sourceItemId", conv.sourceItemId)
        params.set("type", "link")
      } else {
        params.set("type", "workspace")
      }
      
      router.push(`/chat?${params.toString()}`)
    } catch (error) {
      console.error("Failed to load conversation:", error)
      toast.error("Failed to load conversation")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteConversation = async (id: string) => {
    if (!effectiveWorkspaceId) return

    try {
      await chatApi.deleteConversation(effectiveWorkspaceId, id)
      setConversations((prev) => prev.filter((c) => c.id !== id))

      if (activeConversationId === id) {
        setActiveConversationId(null)
        setMessages([])
      }

      toast.success("Conversation deleted")
    } catch (error) {
      console.error("Failed to delete conversation:", error)
      toast.error("Failed to delete conversation")
    }
  }

  const getGreetingText = () => {
    if (chatContext.type === "link") {
      return "Let's Analyze this Link"
    }
    return "Let's Dive Deep"
  }

  return (
    <div className="flex flex-col h-full relative bg-background overflow-hidden">

      {messages.length === 0 && !revealing && !isLoading ? (

        <div className="h-full relative w-full overflow-hidden">
          
          <div 
            className="absolute flex flex-col items-center justify-center transition-all duration-250 ease-linear" 
            style={{ 
              top: 'calc(50% - 160px)',
              left: 0,
              width: '100%',
            }}
          >
            <div className="w-full max-w-3xl px-4">
              <motion.div
                className="px-4"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.45, staggerChildren: 0.2 }}
              >
                <motion.div
                  className="flex items-center gap-2 pb-1"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <GeminiLogo />
                  <h2 className="text-xl font-light">Hello {username}</h2>
                </motion.div>
                <motion.h1
                  className="text-4xl text-muted-foreground mb-2"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {getGreetingText()}
                </motion.h1>
              </motion.div>
              <AI_Prompt
                onSendMessage={handleSendMessage}
                workspaceId={effectiveWorkspaceId}
                disabled={isLoading}
                placeholder={
                  chatContext.type === "link"
                    ? "Ask about this link..."
                    : "Ask about your workspace..."
                }
              />
            </div>
          </div>
        </div>
      ) : (

        <>
          
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto min-h-0 pb-32"
          >
            <div className="max-w-4xl mx-auto space-y-6 px-4 py-6">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                />
              ))}

              {revealing && (
                <ChatMessage key={revealing.id} message={revealing} />
              )}

              {isThinking && (
                <div className="flex justify-start">
                  <div className="p-4">
                    <Reasoning isStreaming={isThinking}>
                      <ReasoningTrigger />
                      <ReasoningContent>
                        Analyzing your request...
                      </ReasoningContent>
                    </Reasoning>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div 
            className="fixed bottom-6 z-20 transition-all duration-300 ease-in-out"
            style={{ 
              left: `calc(${sidebarWidth} + (100% - ${sidebarWidth}) / 2)`,
              transform: 'translateX(-50%)',
              width: `calc(100% - ${sidebarWidth})`,
              maxWidth: '40rem',
            }}
          >
            <span className="bg-background rounded-2xl">
              <AI_Prompt
                onSendMessage={handleSendMessage}
                workspaceId={effectiveWorkspaceId}
                disabled={isLoading}
                placeholder={
                  chatContext.type === "link"
                    ? "Ask about this link..."
                    : "Ask about your workspace..."
                }
              />
            </span>
          </div>
        </>
      )}

      <ChatHistoryDrawer
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        conversations={conversations}
        activeConversationId={activeConversationId || undefined}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        loading={isLoadingConversations}
      />
    </div>
  )
}