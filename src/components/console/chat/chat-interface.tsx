// src/components/console/chat/chat-interface.tsx
"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { History, Sparkles } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { ChatMessage } from "./chat-message"
import { ChatHistoryDrawer } from "./chat-history-drawer"
import { Reasoning, ReasoningTrigger, ReasoningContent } from "../chat/reasoning"
import { Shimmer } from "../chat/shimmer"
import AI_Prompt from "./ai-prompt"
import GeminiLogo from "@/src/components/console/chat/gemini-logo"
import { LoaderThree } from "@/src/components/ui/loader"
import { chatApi } from "@/src/lib/api/chat"
import { useWorkspace } from "@/src/context/workspace-context"
import { useSidebar } from "@/src/components/ui/sidebar"
import { useAuth } from "@/src/context/auth-context"
import { motion } from "motion/react"
import type { Conversation, Message, ChatContextType } from "@/src/types/chat.types"
import { toast } from "sonner"

interface ChatInterfaceProps {
  workspaceId?: string
  sourceItemId?: string
  conversationId?: string
  chatContext: ChatContextType
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState("")
  const [isThinking, setIsThinking] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const { currentWorkspace } = useWorkspace()
  const { state } = useSidebar()
  const { user } = useAuth()

  const sidebarWidth = state === "expanded" ? "16rem" : "3rem"
  const rightMargin = state === "expanded" ? "16rem" : "3rem"
  const username = user?.displayName || user?.email?.split('@')[0] || "User"

  const effectiveWorkspaceId = workspaceId || currentWorkspace?.id

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // Load conversations
  useEffect(() => {
    if (!effectiveWorkspaceId) return

    const loadConversations = async () => {
      setIsLoadingConversations(true)
      try {
        const convs = await chatApi.getConversations(effectiveWorkspaceId)
        setConversations(convs)

        // Load initial conversation if specified
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

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSendMessage = async (content: string, sourceItemIds?: string[]) => {
    if (!effectiveWorkspaceId) {
      toast.error("No workspace selected")
      return
    }

    let convId: string = activeConversationId || ""

    // Create conversation if doesn't exist
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

    // Add user message immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId: convId,
      role: "user",
      content,
      sourceItemIds,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, tempUserMessage])
    setIsLoading(true)
    setIsThinking(true)

    try {
      // Send message with streaming
      const tempAssistantId = `temp-assistant-${Date.now()}`
      setStreamingMessageId(tempAssistantId)
      setStreamingContent("")

      await chatApi.streamMessage(
        effectiveWorkspaceId,
        convId,
        { message: content, sourceItemIds },
        (chunk) => {
          setStreamingContent(chunk)
          setIsThinking(false)
        }
      )

      // Load the complete conversation to get the real message
      const updatedConv = await chatApi.getConversation(effectiveWorkspaceId, convId)
      setMessages(updatedConv.messages || [])

      // Update conversation in list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? { ...updatedConv, lastMessage: updatedConv.messages?.slice(-1)[0]?.content }
            : c
        )
      )
    } catch (error) {
      console.error("Failed to send message:", error)
      toast.error("Failed to send message")

      // Remove temp user message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
    } finally {
      setIsLoading(false)
      setStreamingMessageId(null)
      setStreamingContent("")
      setIsThinking(false)
    }
  }

  const handleSelectConversation = async (id: string) => {
    if (!effectiveWorkspaceId) return

    setActiveConversationId(id)
    setIsLoading(true)

    try {
      const conv = await chatApi.getConversation(effectiveWorkspaceId, id)
      setMessages(conv.messages || [])
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
    <div className="flex flex-col h-full relative bg-background">
      {/* Header - Minimal (History Toggle Only) */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsHistoryOpen(true)}
          className="hover:bg-muted/50"
        >
          <History className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>

      {messages.length === 0 && !isLoading ? (
        // Greeting View
        <div className="h-full relative w-full overflow-hidden">
          <div 
            className="absolute flex flex-col items-center justify-center transition-all duration-250 ease-linear" 
            style={{ 
              top: 'calc(50% - 200px)',
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
        // Chat View
        <>
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-4 py-6"
          >
            <div className="max-w-4xl mx-auto space-y-6 pb-4">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isStreaming={streamingMessageId === msg.id}
                  streamingContent={streamingContent}
                />
              ))}

              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-muted/30 rounded-2xl p-4">
                    <Reasoning isStreaming={isThinking}>
                      <ReasoningTrigger />
                      <ReasoningContent>
                        Analyzing your request and searching through your knowledge base...
                      </ReasoningContent>
                    </Reasoning>
                  </div>
                </div>
              )}

              {isLoading && !isThinking && !streamingMessageId && (
                <div className="flex justify-center">
                  <LoaderThree />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-background/95 backdrop-blur-sm py-4 px-4">
            <div className="max-w-4xl mx-auto">
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
        </>
      )}

      {/* History Drawer */}
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