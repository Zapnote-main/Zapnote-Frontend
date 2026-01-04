"use client"

import { useEffect, useState } from "react"
import { Trash2, User } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { LoaderThree } from "@/src/components/ui/loader"
import { useWorkspace } from "@/src/context/workspace-context"
import { useAuth } from "@/src/context/auth-context"
import type { WorkspaceRole } from "@/src/types/workspace"
import { cn } from "@/src/lib/utils"

interface WorkspaceMembersListProps {
  workspaceId: string
  userRole: WorkspaceRole
}

const roleColors = {
  OWNER: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  EDITOR: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  VIEWER: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
}

export function WorkspaceMembersList({ workspaceId, userRole }: WorkspaceMembersListProps) {
  const { members, refreshMembers, removeMember } = useWorkspace()
  const { user } = useAuth()
  const [loading, setLoading] = useState(!members[workspaceId])

  const workspaceMembers = members[workspaceId] || []

  useEffect(() => {
    if (!members[workspaceId]) {
      setLoading(true)
      refreshMembers(workspaceId).finally(() => setLoading(false))
    }
  }, [workspaceId, refreshMembers, members])

  const canManageMembers = userRole === "OWNER"

  const handleRemove = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return
    await removeMember(workspaceId, memberId)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <LoaderThree />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium mb-3">Team Members ({workspaceMembers.length})</h4>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {workspaceMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {member.user.displayName || member.user.username || member.user.email}
                  {member.user.id === user?.uid && (
                    <span className="text-xs text-muted-foreground ml-2">(You)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {member.user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className={cn("text-xs", roleColors[member.role])}>
                {member.role}
              </Badge>
              {canManageMembers && member.user.id !== user?.uid && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemove(member.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}