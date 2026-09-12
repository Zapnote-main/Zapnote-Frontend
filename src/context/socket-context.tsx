"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { useAuth } from "./auth-context"
import { useWorkspace } from "./workspace-context"

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [socketUserId, setSocketUserId] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let newSocket: Socket | null = null

    const initSocket = async () => {
      if (!user) return

      const uid = user.uid
      const token = await user.getIdToken()


      const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

      newSocket = io(url, {
        auth: {
          token
        },
        transports: ["websocket", "polling"],
        withCredentials: true
      })

      newSocket.on("connect", () => {
        setIsConnected(true)
        console.log("Socket connected")
      })

      newSocket.on("connect_error", (err) => {
        console.error("Socket connection error:", err)
        setIsConnected(false)
      })

      newSocket.on("disconnect", () => {
        setIsConnected(false)
        console.log("Socket disconnected")
      })

      setSocket(newSocket)
      setSocketUserId(uid)
    }

    if (user) {
      initSocket()
    }

    return () => {
      if (newSocket) {
        newSocket.off()
        newSocket.disconnect()
      }
    }
  }, [user])

  const workspaceId = currentWorkspace?.id

  // Server-side events are emitted to a `workspace:<id>` room, so without joining
  // it nothing reaches this client. Room membership is per-connection and lost on
  // reconnect, so re-join on every `connect` rather than only once.
  useEffect(() => {
    if (!socket || !workspaceId) return

    const subscribe = () => socket.emit("subscribe:workspace", workspaceId)

    if (socket.connected) subscribe()
    socket.on("connect", subscribe)

    return () => {
      socket.off("connect", subscribe)
      if (socket.connected) socket.emit("unsubscribe:workspace", workspaceId)
    }
  }, [socket, workspaceId])

  const effectiveSocket = user && socketUserId === user.uid ? socket : null
  const effectiveIsConnected = user && socketUserId === user.uid ? isConnected : false

  return (
    <SocketContext.Provider value={{ socket: effectiveSocket, isConnected: effectiveIsConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}
