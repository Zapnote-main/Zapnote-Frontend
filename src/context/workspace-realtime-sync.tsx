"use client"

import { useEffect } from "react"
import { useSocket } from "@/src/context/socket-context"
import { useWorkspace } from "@/src/context/workspace-context"

/**
 * Turns workspace knowledge events into refreshes.
 *
 * Lives below both providers because it needs the socket (created inside
 * WorkspaceProvider) and the workspace state it updates. Without this the server
 * emitted knowledge:created / knowledge:updated / knowledge:deleted into a room
 * nobody was listening on, which is why the UI had to poll every 3 seconds.
 */
export function WorkspaceRealtimeSync() {
  const { socket } = useSocket()
  const { currentWorkspace, refreshRecentItems } = useWorkspace()
  const workspaceId = currentWorkspace?.id

  useEffect(() => {
    if (!socket || !workspaceId) return

    // Silent: the list is already on screen, so refresh it without a loading flash.
    const resync = () => {
      refreshRecentItems(workspaceId, true)
    }

    socket.on("knowledge:created", resync)
    socket.on("knowledge:updated", resync)
    socket.on("knowledge:deleted", resync)

    return () => {
      socket.off("knowledge:created", resync)
      socket.off("knowledge:updated", resync)
      socket.off("knowledge:deleted", resync)
    }
  }, [socket, workspaceId, refreshRecentItems])

  return null
}
