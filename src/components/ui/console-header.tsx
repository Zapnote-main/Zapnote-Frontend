"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SidebarTrigger } from "@/src/components/ui/sidebar"
import { Separator } from "@/src/components/ui/separator"
import { Button } from "@/src/components/ui/button"
import { History, MessageSquare } from "lucide-react"
import { useWorkspace } from "@/src/context/workspace-context"
import { useChatUI } from "@/src/context/chat-ui-context"
import { useSpaces } from "@/src/context/spaces-context"
import { useState, Fragment } from "react"
import { AddLinkDialog } from "@/src/components/console/home/add-link-dialog"
import { 
  Loader2, 
  Save, 
  Users, 
  Lock, 
  Trash2, 
  Plus, 
  ChevronDown 
} from "lucide-react"
import { Badge } from "@/src/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"

export function ConsoleHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentWorkspace } = useWorkspace()
  const { 
    spaces, 
    currentSpace, 
    setCurrentSpace, 
    isLoading: isSpacesLoading, 
    createSpace, 
    deleteSpace, 
    triggerSave, 
    isSaving 
  } = useSpaces()
  const { setIsHistoryOpen } = useChatUI()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newSpaceName, setNewSpaceName] = useState("")

  const isChatPage = pathname.includes("/chat")
  const isWorkspacePage = pathname.startsWith("/home/") && pathname.split("/").length === 3
  const isSpacesPage = pathname === "/spaces"

  const canEdit = currentWorkspace?.role === "OWNER" || currentWorkspace?.role === "EDITOR"
  const isOwner = currentWorkspace?.role === "OWNER"

  const handleCreateSpace = async () => {
    try {
      await createSpace(newSpaceName)
      setNewSpaceName("")
      setIsCreateDialogOpen(false)
    } catch (error) {
      // toast is handled in context
    }
  }

  const handleDeleteSpace = async (spaceId: string) => {
    if (confirm("Are you sure you want to delete this space? This action cannot be undone.")) {
       await deleteSpace(spaceId)
    }
  }

  const generateBreadcrumbs = () => {
    // Special handling for Chat page to show "Chat / Workspace Name"
    if (isChatPage) {
      return (
        <>
          <span className="text-sm text-muted-foreground">Chat</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-semibold text-foreground">
            {currentWorkspace?.name || "Workspace"}
          </span>
        </>
      )
    }

    // Default handling for other pages
    const path = pathname.split("?")[0].replace(/\/$/, "")
    const segments = path.split("/").filter(Boolean)

    const segmentMap: Record<string, string> = {
      "(console)": "", 
      "chat": "Chat",
      "home": "Home",
      "library": "Library",
      "search": "Search",
      "spaces": "Spaces",
      "settings": "Settings",
    }
    
    return segments.map((segment, index) => {
      // If segment is a workspace ID (long string), replace with workspace name if available
      let title = segmentMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      
      // Basic check if segment looks like an ID (or just check if it matches current workspace ID)
      if (currentWorkspace && segment === currentWorkspace.id) {
        title = currentWorkspace.name
      }

      const isLast = index === segments.length - 1
      
      return (
        <Fragment key={index}>
          <span className={`text-sm ${isLast && (!currentSpace || segment !== "spaces") ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
            {title}
          </span>
          {(!isLast || (currentSpace && segment === "spaces")) && <span className="text-muted-foreground">/</span>}
          {isLast && currentSpace && segment === "spaces" && (
             <span className="text-sm font-semibold text-foreground">
               {currentSpace.name}
             </span>
          )}
        </Fragment>
      )
    })
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 rounded-t-xl">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <nav className="flex items-center gap-2">
           {generateBreadcrumbs()}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {isSpacesPage && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-between" disabled={isSpacesLoading}>
                  <span className="truncate">{currentSpace?.name || "Select Space"}</span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[200px]">
                {spaces.length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground text-center">No spaces found</div>
                )}
                {spaces.map((space) => (
                  <DropdownMenuItem 
                    key={space.id}
                    onSelect={() => setCurrentSpace(space)}
                    className="flex items-center justify-between group"
                  >
                    <span className="truncate flex-1">{space.name}</span>
                    {isOwner && (
                       <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                         {/* We can add delete/edit here later, for now just selection */}
                         <Trash2 
                           className="h-3 w-3 text-destructive cursor-pointer" 
                           onClick={(e) => {
                             e.stopPropagation()
                             handleDeleteSpace(space.id)
                           }}
                         />
                       </div>
                    )}
                  </DropdownMenuItem>
                ))}
                
                {canEdit && (
                  <>
                     {spaces.length > 0 && <div className="h-px bg-border my-1" />}
                     <DropdownMenuItem onSelect={() => setIsCreateDialogOpen(true)}>
                       <Plus className="mr-2 h-4 w-4" />
                       Create New Space
                     </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {isOwner && currentSpace && (
               <Button
                 variant="ghost"
                 size="icon"
                 className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                 onClick={() => handleDeleteSpace(currentSpace.id)}
                 title="Delete this space"
               >
                 <Trash2 className="h-4 w-4" />
               </Button>
            )}

             <Button
              variant="default" // Changed to default for visibility
              size="sm"
              onClick={triggerSave}
              disabled={isSaving || !canEdit || !currentSpace}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </>
        )}

        {isWorkspacePage && currentWorkspace && (
          <>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/chat?workspaceId=${currentWorkspace.id}&type=workspace`)}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </Button>
            {currentWorkspace.role !== 'VIEWER' && <AddLinkDialog workspaceId={currentWorkspace.id} />}
          </>
        )}
        {isChatPage && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsHistoryOpen(true)}
          >
            <History className="h-5 w-5" />
          </Button>
        )}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Space</DialogTitle>
            <DialogDescription>
              Create a new space for your whiteboard diagrams.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Ex: System Architecture"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSpace} disabled={!newSpaceName.trim() || isSpacesLoading}>
              {isSpacesLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Space
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
