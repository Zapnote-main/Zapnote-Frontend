"use client"

import { useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { LoaderThree } from "@/src/components/ui/loader"
import { KnowledgeItemCard } from "@/src/components/console/workspace/knowledge-item-card"
import { AddLinkDialog } from "@/src/components/console/home/add-link-dialog"
import { useWorkspace } from "@/src/context/workspace-context"

export default function WorkspacePage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params)
  const router = useRouter()
  const { 
    workspaces, 
    currentWorkspace, 
    setCurrentWorkspace, 
    recentItems, 
    refreshRecentItems,
    loading,
    itemsLoading
  } = useWorkspace()

  useEffect(() => {
    if (workspaces.length > 0) {
      const workspace = workspaces.find(w => w.id === workspaceId)
      if (workspace) {
        if (currentWorkspace?.id !== workspaceId) {
          setCurrentWorkspace(workspace)
          refreshRecentItems(workspace.id)
        }
      }
    }
  }, [workspaceId, workspaces, setCurrentWorkspace, refreshRecentItems, currentWorkspace])

  if (loading && !currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderThree />
      </div>
    )
  }

  if (!currentWorkspace && !loading && workspaces.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p>Workspace not found</p>
        <Button variant="link" onClick={() => router.push('/home')}>
          Go back home
        </Button>
      </div>
    )
  }

  if (!currentWorkspace) {
     return (
      <div className="flex items-center justify-center h-full">
        <LoaderThree />
      </div>
    )
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/home')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{currentWorkspace.name}</h1>
            {currentWorkspace.description && (
              <p className="text-muted-foreground">{currentWorkspace.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/chat?workspaceId=${workspaceId}`)}>
            Chat
          </Button>
          <AddLinkDialog workspaceId={workspaceId} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {itemsLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoaderThree />
          </div>
        ) : recentItems.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/10 h-full flex flex-col items-center justify-center">
            <p className="text-muted-foreground mb-4">No items in this workspace yet</p>
            <AddLinkDialog workspaceId={workspaceId} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
            {recentItems.map((item) => (
              <KnowledgeItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
