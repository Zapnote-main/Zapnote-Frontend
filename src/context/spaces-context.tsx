"use client"

import React, { createContext, useContext, useState } from "react"

type SpacesContextType = {
  selectedTool: { type: 'link', url: string, label: string } | null
  setSelectedTool: (tool: { type: 'link', url: string, label: string } | null) => void
}

const SpacesContext = createContext<SpacesContextType | undefined>(undefined)

export function SpacesProvider({ children }: { children: React.ReactNode }) {
  const [selectedTool, setSelectedTool] = useState<{ type: 'link', url: string, label: string } | null>(null)

  return (
    <SpacesContext.Provider value={{ selectedTool, setSelectedTool }}>
      {children}
    </SpacesContext.Provider>
  )
}

export function useSpaces() {
  const context = useContext(SpacesContext)
  if (context === undefined) {
    throw new Error("useSpaces must be used within a SpacesProvider")
  }
  return context
}
