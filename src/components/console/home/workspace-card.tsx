"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Users, Link as LinkIcon, ChevronDown, ChevronUp, MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "../../ui/badge"
import { Button } from "@/src/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/src/components/ui/collapsible"
import type { WorkspaceWithRole } from "@/src/types/workspace"
import { AddMemberDialog } from "./add-member-dialog"
import { DeleteWorkspaceDialog } from "./delete-workspace-dialog"
import { WorkspaceMembersList } from "./workspace-members-list"
import { cn } from "@/src/lib/utils"
import { useWorkspace } from "@/src/context/workspace-context"

interface WorkspaceCardProps {
  workspace: WorkspaceWithRole
  isActive: boolean
  onSelect: () => void
}

const roleColors = {
  OWNER: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  EDITOR: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  VIEWER: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
}

export function WorkspaceCard({ workspace, isActive, onSelect }: WorkspaceCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { members } = useWorkspace()

  const canEdit = workspace.role === "OWNER" || workspace.role === "EDITOR"

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/chat?workspaceId=${workspace.id}&type=workspace`)
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card 
        className={cn(
          "transition-all hover:shadow-md cursor-pointer border-transparent",
          isActive 
            ? "shadow-[0_0_20px_rgba(var(--primary),0.15)] border-primary/50 dark:shadow-[0_0_20px_rgba(var(--primary),0.3)]" 
            : "border-border"
        )}
        onClick={onSelect}
      >
        <CollapsibleTrigger asChild>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg flex items-center gap-2 mb-2">
                  <span 
                    className="hover:underline cursor-pointer hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/home/${workspace.id}`)
                    }}
                  >
                    {workspace.name}
                  </span>
                  <Badge variant="outline" className={cn("text-xs", roleColors[workspace.role])}>
                    {workspace.role}
                  </Badge>
                </CardTitle>
                {workspace.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {workspace.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleChatClick}
                  title="Chat with workspace"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                {workspace.role === "OWNER" && (
                  <DeleteWorkspaceDialog 
                    workspaceId={workspace.id} 
                    workspaceName={workspace.name} 
                  />
                )}
                <Button variant="ghost" size="icon">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {(() => {
                  const count = workspace.memberCount ?? (members[workspace.id]?.length ?? 0)
                  return `${count} ${count === 1 ? 'member' : 'members'}`
                })()}
              </span>
              <span className="flex items-center gap-1">
                <LinkIcon className="h-4 w-4" />
                {(() => {
                  const count = workspace.itemCount ?? 0
                  return `${count} ${count === 1 ? 'item' : 'items'}`
                })()}
              </span>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            <div className="flex gap-2 flex-wrap">
              {canEdit && <AddMemberDialog workspaceId={workspace.id} />}
            </div>

            <WorkspaceMembersList workspaceId={workspace.id} userRole={workspace.role} />
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}