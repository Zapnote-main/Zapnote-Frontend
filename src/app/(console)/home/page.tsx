"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoaderThree } from "@/src/components/ui/loader"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { CreateWorkspaceDialog } from "@/src/components/console/home/create-workspace-dialog"
import { WorkspaceCard } from "@/src/components/console/home/workspace-card"
import { RecentItemsList } from "@/src/components/console/home/recent-items-list"
import Calendar31 from "@/src/components/console/home/calendar-31"
import { useWorkspace } from "@/src/context/workspace-context"
import { useAuth } from "@/src/context/auth-context"

export default function HomePage() {
  const { user } = useAuth()
  const {
    workspaces,
    currentWorkspace,
    recentItems,
    loading,
    setCurrentWorkspace,
    refreshRecentItems,
  } = useWorkspace()
  const router = useRouter()

  useEffect(() => {
    if (currentWorkspace) {
      refreshRecentItems(currentWorkspace.id)
    }
  }, [currentWorkspace, refreshRecentItems])

  const calendarData = recentItems.reduce((acc, item) => {
    const dateKey = new Date(item.createdAt).toISOString().split('T')[0]
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push({
      id: item.id,
      sourceUrl: item.sourceUrl,
      userIntent: item.userIntent,
      summary: item.summary,
      createdAt: item.createdAt,
      workspaceName: currentWorkspace?.name || 'Unknown',
    })
    return acc
  }, {} as Record<string, any[]>)

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please log in to continue</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderThree />
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-muted-foreground">
          Manage your workspaces and knowledge base
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workspaces Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Workspaces</CardTitle>
                <CreateWorkspaceDialog />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoaderThree />
                </div>
              ) : workspaces.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    You dont&apos; have any workspaces yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-150 overflow-y-auto p-2">
                  {workspaces.map((workspace) => (
                    <WorkspaceCard
                      key={workspace.id}
                      workspace={workspace}
                      isActive={currentWorkspace?.id === workspace.id}
                      onSelect={() => {
                        setCurrentWorkspace(workspace)
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Items Section */}
          {currentWorkspace && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Items</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Latest additions to {currentWorkspace.name}
                </p>
              </CardHeader>
              <CardContent>
                <RecentItemsList items={recentItems} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Calendar Section */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Calendar</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Calendar31 calendarData={calendarData} />
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Workspaces</span>
                <span className="text-2xl font-bold">{workspaces.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Owned Workspaces</span>
                <span className="text-2xl font-bold">
                  {workspaces.filter(w => w.role === 'OWNER').length}
                </span>
              </div>
              {currentWorkspace && (
                <>
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-3">Current Workspace</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Members</span>
                        <span className="font-semibold">{currentWorkspace.memberCount || 1}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Items</span>
                        <span className="font-semibold">{currentWorkspace.itemCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}