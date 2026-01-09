"use client"

import React, { createContext, useContext, useState } from "react"

interface ChatUIContextType {
  isHistoryOpen: boolean
  setIsHistoryOpen: (open: boolean) => void
}

const ChatUIContext = createContext<ChatUIContextType | undefined>(undefined)

export function ChatUIProvider({ children }: { children: React.ReactNode }) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  return (
    <ChatUIContext.Provider value={{ isHistoryOpen, setIsHistoryOpen }}>
      {children}
    </ChatUIContext.Provider>
  )
}

export function useChatUI() {
  const context = useContext(ChatUIContext)
  if (context === undefined) {
    throw new Error("useChatUI must be used within a ChatUIProvider")
  }
  return context
}
