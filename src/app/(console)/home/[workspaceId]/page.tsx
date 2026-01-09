"use client"

import { useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, MessageSquare } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { LoaderThree } from "@/src/components/ui/loader"
import { DraggableKnowledgeItemCard } from "@/src/components/console/workspace/knowledge-item-card"
import { AddLinkDialog } from "@/src/components/console/home/add-link-dialog"
import { useWorkspace } from "@/src/context/workspace-context"
import { useSidebar } from "@/src/components/ui/sidebar"

export default function WorkspacePage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params)
  const { open } = useSidebar()
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
      <div className="fixed top-[calc(50vh-2.5rem)] left-[calc(50vw-2.5rem)]">
        <LoaderThree />
      </div>
    )
  }

  // Check if workspace exists
  const workspaceExists = workspaces.some(w => w.id === workspaceId);
  const isSwitchingWorkspace = currentWorkspace?.id !== workspaceId;

  if (!loading && workspaces.length > 0 && !workspaceExists) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p>Workspace not found</p>
        <Button variant="link" onClick={() => router.push('/home')}>
          Go back home
        </Button>
      </div>
    )
  }

  // Initial loading state or switching workspaces
  if (!currentWorkspace || (isSwitchingWorkspace && workspaceExists)) {
     return (
      <div className="fixed top-[calc(50vh-2.5rem)] left-[calc(50vw-2.5rem)]">
        <LoaderThree />
      </div>
    )
  }

  return (
    <div className="space-y-6 h-full flex flex-col pt-4">
      <div className="flex-1 overflow-y-auto min-h-0">
        {itemsLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoaderThree />
          </div>
        ) : recentItems.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/10 h-full flex flex-col items-center justify-center">
            <p className="text-muted-foreground mb-4">No items in this workspace yet</p>
            {currentWorkspace.role !== 'VIEWER' && <AddLinkDialog workspaceId={workspaceId} />}
          </div>
        ) : (
          <div className={`grid grid-cols-1 gap-4 pb-6 ${open ? 'lg:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
            {recentItems.map((item) => (
              <DraggableKnowledgeItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}