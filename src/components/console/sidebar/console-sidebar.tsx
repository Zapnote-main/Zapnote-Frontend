"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  HomeIcon,
  LibraryIcon,
  SearchIcon,
  MessageCircleIcon,
  FolderIcon,
  ChevronRightIcon,
  ChevronsUpDown,
  LogOut,
  Sparkles,
  UserIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useSpaces } from "@/src/context/spaces-context"
import { useAuth } from "@/src/context/auth-context"
import { useWorkspace } from "@/src/context/workspace-context"
import {
  FileText,
  Link as LinkIcon, 
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/src/components/ui/sidebar"

const libraryViews = [
  { id: "category", label: "Category View", url: "/library/category" },
  { id: "timeline", label: "Timeline View", url: "/library/timeline" },
  { id: "recent", label: "Recently Added", url: "/library/recent" },
]

export function ConsoleSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { setTheme, theme } = useTheme()
  const { setSelectedTool } = useSpaces()
  const { user, logout } = useAuth()
  const { recentItems } = useWorkspace()

  const handleLinkClick = (e: React.MouseEvent, url: string, label: string) => {
    if (pathname === "/spaces") {
      e.preventDefault()
      setSelectedTool({ type: 'link', url, label })
    }
  }

  const handleDragStart = (e: React.DragEvent, url: string, label: string, itemId?: string) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ type: 'link', url, label, itemId }))
  }

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/home"}>
              <Link href="/home">
                <HomeIcon />
                <span>Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <LibraryIcon />
                      <span>Library</span>
                      <ChevronRightIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent id="sidebar-library-content">
                    <SidebarMenuSub>
                      {libraryViews.map((view) => (
                        <SidebarMenuSubItem key={view.id}>
                          <SidebarMenuSubButton 
                            asChild 
                            isActive={pathname === view.url}
                          >
                            <Link 
                              href={view.url}
                              onClick={(e) => handleLinkClick(e, view.url, view.label)}
                              onDoubleClick={() => pathname === "/spaces" && router.push(view.url)}
                              draggable
                              onDragStart={(e) => handleDragStart(e, view.url, view.label)}
                            >
                              <span>{view.label}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <FileText />
                      <span>Recent Files</span>
                      <ChevronRightIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {recentItems.length === 0 && (
                        <SidebarMenuSubItem>
                           <span className="text-xs text-muted-foreground px-2 py-1">No recent items</span>
                        </SidebarMenuSubItem>
                      )}
                      {recentItems.slice(0, 10).map((item) => (
                        <SidebarMenuSubItem key={item.id}>
                          <SidebarMenuSubButton 
                            asChild 
                            className="cursor-grab active:cursor-grabbing"
                          >
                            <a 
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                if (pathname === "/spaces") {
                                  e.preventDefault()
                                  handleLinkClick(e, item.sourceUrl, item.summary || "Link")
                                }
                              }}
                              draggable
                              onDragStart={(e) => handleDragStart(e, item.sourceUrl, item.summary || "Link", item.id)}
                              title={item.summary || item.sourceUrl}
                            >
                              <LinkIcon className="w-3 h-3 mr-2 opacity-70" />
                              <span className="truncate">{item.summary || "Untitled Link"}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/search"}>
                  <Link href="/search">
                    <SearchIcon />
                    <span>Search</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/chat"}>
                  <Link href="/chat">
                    <MessageCircleIcon />
                    <span>Chat</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/spaces"}>
                  <Link href="/spaces">
                    <FolderIcon />
                    <span>Spaces</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  id="sidebar-user-dropdown-trigger"
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <UserIcon className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.displayName || user?.email?.split('@')[0] || 'User'}</span>
                    <span className="truncate text-xs">{user?.email || ''}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <UserIcon className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user?.displayName || user?.email?.split('@')[0] || 'User'}</span>
                      <span className="truncate text-xs">{user?.email || ''}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  <Sparkles className="mr-2 size-4" />
                  Toggle Theme
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => {
                  try {
                    await logout();
                  } catch (error) {
                    console.error('Logout failed:', error);
                  }
                }}>
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}