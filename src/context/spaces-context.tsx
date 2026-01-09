"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { useWorkspace } from "./workspace-context"
import { spacesApi, type Space } from "@/src/lib/api/spaces"
import { toast } from "sonner"

type SpacesContextType = {
  selectedTool: { type: 'link', url: string, label: string } | null
  setSelectedTool: (tool: { type: 'link', url: string, label: string } | null) => void
  
  spaces: Space[]
  currentSpace: Space | null
  isLoading: boolean
  isSaving: boolean
  
  setCurrentSpace: (space: Space | null) => void
  createSpace: (name: string) => Promise<void>
  deleteSpace: (spaceId: string) => Promise<void>
  
  // mechanism for header to trigger save in whiteboard
  registerSaveHandler: (handler: () => Promise<void> | void) => void
  triggerSave: () => Promise<void>
}

const SpacesContext = createContext<SpacesContextType | undefined>(undefined)

export function SpacesProvider({ children }: { children: React.ReactNode }) {
  const { currentWorkspace } = useWorkspace()
  const [selectedTool, setSelectedTool] = useState<{ type: 'link', url: string, label: string } | null>(null)
  
  const [spaces, setSpaces] = useState<Space[]>([])
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveHandler, setSaveHandler] = useState<(() => Promise<void> | void) | null>(null)

  const loadSpaces = useCallback(async () => {
    if (!currentWorkspace) {
      setSpaces([])
      setCurrentSpace(null)
      return
    }
    
    setIsLoading(true)
    try {
      const spacesData = await spacesApi.getSpaces(currentWorkspace.id)
      setSpaces(spacesData)

      // Auto-select first space if none selected or current not in list
      if (spacesData.length > 0) {
        // preserve current if it exists
        setCurrentSpace(prev => {
          if (prev && spacesData.find(s => s.id === prev.id)) return prev
          return spacesData[0]
        })
      } else {
        setCurrentSpace(null)
      }
    } catch (error) {
      console.error("Failed to load spaces:", error)
      toast.error("Failed to load spaces")
    } finally {
      setIsLoading(false)
    }
  }, [currentWorkspace])

  // Load spaces when workspace changes
  useEffect(() => {
    loadSpaces()
  }, [loadSpaces])

  const createSpace = useCallback(async (name: string) => {
    if (!currentWorkspace || !name.trim()) return

    try {
      const newSpace = await spacesApi.createSpace(currentWorkspace.id, {
        name: name.trim(),
      })
      setSpaces(prev => [...prev, newSpace])
      setCurrentSpace(newSpace)
      toast.success("Space created successfully")
    } catch (error) {
      console.error("Failed to create space:", error)
      toast.error("Failed to create space")
      throw error
    }
  }, [currentWorkspace])

  const deleteSpace = useCallback(async (spaceId: string) => {
    if (!currentWorkspace) return

    try {
      await spacesApi.deleteSpace(currentWorkspace.id, spaceId)
      
      setSpaces(prev => {
        const remaining = prev.filter(s => s.id !== spaceId)
        if (currentSpace?.id === spaceId) {
          setCurrentSpace(remaining.length > 0 ? remaining[0] : null)
        }
        return remaining
      })
      
      toast.success("Space deleted successfully")
    } catch (error) {
      console.error("Failed to delete space:", error)
      toast.error("Failed to delete space")
      throw error
    }
  }, [currentWorkspace, currentSpace])

  const registerSaveHandler = useCallback((handler: () => Promise<void> | void) => {
    setSaveHandler(() => handler)
  }, [])

  const triggerSave = useCallback(async () => {
    if (saveHandler) {
      setIsSaving(true)
      try {
        await saveHandler()
      } finally {
        setIsSaving(false)
      }
    }
  }, [saveHandler])

  return (
    <SpacesContext.Provider value={{
      selectedTool, 
      setSelectedTool,
      spaces,
      currentSpace,
      isLoading,
      isSaving,
      setCurrentSpace,
      createSpace,
      deleteSpace,
      registerSaveHandler,
      triggerSave
    }}>
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
