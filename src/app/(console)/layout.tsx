import { ConsoleSidebar } from "@/src/components/console/sidebar/console-sidebar"
import { ConsoleHeader } from "@/src/components/ui/console-header"
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar"
import { SpacesProvider } from "@/src/context/spaces-context"
import { WorkspaceProvider } from "@/src/context/workspace-context"
import { ChatUIProvider } from "@/src/context/chat-ui-context"
import { AuthGuard } from "@/src/components/auth/auth-guard"
import { SocketProvider } from "@/src/context/socket-context"
import { WorkspaceRealtimeSync } from "@/src/context/workspace-realtime-sync"

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <WorkspaceProvider>
        <SocketProvider>
          <WorkspaceRealtimeSync />
          <SpacesProvider>
          <ChatUIProvider>
            <SidebarProvider>
              <ConsoleSidebar />
              <SidebarInset>
                <ConsoleHeader />
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                  {children}
                </div>
              </SidebarInset>
            </SidebarProvider>
          </ChatUIProvider>
        </SpacesProvider>
        </SocketProvider>
      </WorkspaceProvider>
    </AuthGuard>
  )
}