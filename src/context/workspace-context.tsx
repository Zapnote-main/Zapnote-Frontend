"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { workspacesApi } from '@/src/lib/api/workspaces';
import { knowledgeApi } from '@/src/lib/api/knowledge';
import { useAuth } from './auth-context';
import type {
  WorkspaceWithRole,
  WorkspaceMemberWithUser,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  AddMemberInput,
  UpdateMemberRoleInput,
  CreateKnowledgeItemInput,
  KnowledgeItem,
} from '@/src/types/workspace';
import { toast } from 'sonner';

interface WorkspaceContextType {
  workspaces: WorkspaceWithRole[];
  currentWorkspace: WorkspaceWithRole | null;
  members: Record<string, WorkspaceMemberWithUser[]>;
  recentItems: KnowledgeItem[];
  loading: boolean;
  itemsLoading: boolean;

  setCurrentWorkspace: (workspace: WorkspaceWithRole | null) => void;
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (input: CreateWorkspaceInput) => Promise<WorkspaceWithRole>;
  updateWorkspace: (workspaceId: string, input: UpdateWorkspaceInput) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;

  refreshMembers: (workspaceId: string) => Promise<void>;
  addMember: (workspaceId: string, input: AddMemberInput) => Promise<void>;
  updateMemberRole: (workspaceId: string, memberId: string, role: UpdateMemberRoleInput) => Promise<void>;
  removeMember: (workspaceId: string, memberId: string) => Promise<void>;

  refreshRecentItems: (workspaceId: string, silent?: boolean) => Promise<void>;
  createKnowledgeItem: (workspaceId: string, input: CreateKnowledgeItemInput) => Promise<KnowledgeItem>;
  updateKnowledgeItem: (workspaceId: string, itemId: string, input: { userIntent?: string }) => Promise<void>;
  deleteKnowledgeItem: (workspaceId: string, itemId: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<WorkspaceWithRole | null>(null);
  const [members, setMembers] = useState<Record<string, WorkspaceMemberWithUser[]>>({});
  const [recentItems, setRecentItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);

  // The mutation callbacks below need the *current* workspace but must keep stable
  // identities: they are dependencies of effects that themselves set the current
  // workspace, so rebuilding them on every change would loop. Reading through a ref
  // gives them fresh values with empty dependency lists.
  const currentWorkspaceRef = useRef<WorkspaceWithRole | null>(null);
  useEffect(() => {
    currentWorkspaceRef.current = currentWorkspace;
  }, [currentWorkspace]);

  const currentWorkspaceId = currentWorkspace?.id;

  const setCurrentWorkspace = useCallback((workspace: WorkspaceWithRole | null) => {
    setCurrentWorkspaceState(workspace);
    if (workspace) {
      localStorage.setItem('currentWorkspaceId', workspace.id);
    } else {
      localStorage.removeItem('currentWorkspaceId');
    }
  }, []);

  /**
   * Applies a patch to one workspace in both the list and the current selection.
   *
   * Returns the previous state untouched when nothing actually changes. That bail-out
   * matters: `currentWorkspace` is an effect dependency, so handing back a new object
   * with identical values would retrigger that effect and refetch forever.
   */
  const patchWorkspace = useCallback(
    (workspaceId: string, makePatch: (w: WorkspaceWithRole) => Partial<WorkspaceWithRole>) => {
      const apply = (w: WorkspaceWithRole): WorkspaceWithRole => {
        const patch = makePatch(w);
        const changed = (Object.keys(patch) as (keyof WorkspaceWithRole)[]).some(
          (k) => w[k] !== patch[k]
        );
        return changed ? { ...w, ...patch } : w;
      };

      setWorkspaces((prev) => {
        let dirty = false;
        const next = prev.map((w) => {
          if (w.id !== workspaceId) return w;
          const updated = apply(w);
          if (updated !== w) dirty = true;
          return updated;
        });
        return dirty ? next : prev;
      });

      setCurrentWorkspaceState((prev) => (prev && prev.id === workspaceId ? apply(prev) : prev));
    },
    []
  );

  const refreshWorkspaces = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await workspacesApi.getWorkspaces();
      setWorkspaces(data);
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
      toast.error('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Auto-select workspace
  useEffect(() => {
    if (workspaces.length > 0 && !currentWorkspace) {
      const savedId = localStorage.getItem('currentWorkspaceId');
      const savedWorkspace = workspaces.find(w => w.id === savedId);

      if (savedWorkspace) {
        setCurrentWorkspaceState(savedWorkspace);
      } else {
        setCurrentWorkspaceState(workspaces[0]);
        localStorage.setItem('currentWorkspaceId', workspaces[0].id);
      }
    }
  }, [workspaces, currentWorkspace]);

  const createWorkspace = useCallback(async (input: CreateWorkspaceInput) => {
    try {
      const workspace = await workspacesApi.createWorkspace(input);
      setWorkspaces(prev => [workspace, ...prev]);
      toast.success('Workspace created successfully');
      return workspace;
    } catch (error) {
      console.error('Failed to create workspace:', error);
      toast.error('Failed to create workspace');
      throw error;
    }
  }, []);

  const updateWorkspace = useCallback(async (workspaceId: string, input: UpdateWorkspaceInput) => {
    try {
      const updated = await workspacesApi.updateWorkspace(workspaceId, input);
      setWorkspaces(prev => prev.map(w => w.id === workspaceId ? updated : w));
      if (currentWorkspaceRef.current?.id === workspaceId) {
        setCurrentWorkspace(updated);
      }
      toast.success('Workspace updated successfully');
    } catch (error) {
      console.error('Failed to update workspace:', error);
      toast.error('Failed to update workspace');
      throw error;
    }
  }, [setCurrentWorkspace]);

  const deleteWorkspace = useCallback(async (workspaceId: string) => {
    try {
      await workspacesApi.deleteWorkspace(workspaceId);
      setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
      if (currentWorkspaceRef.current?.id === workspaceId) {
        setCurrentWorkspace(null);
      }
      toast.success('Workspace deleted successfully');
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      toast.error('Failed to delete workspace');
      throw error;
    }
  }, [setCurrentWorkspace]);

  const refreshMembers = useCallback(async (workspaceId: string) => {
    try {
      const data = await workspacesApi.getMembers(workspaceId);
      setMembers(prev => ({ ...prev, [workspaceId]: data }));
      patchWorkspace(workspaceId, () => ({ memberCount: data.length }));
    } catch (error) {
      console.error('Failed to fetch members:', error);
      toast.error('Failed to load members');
    }
  }, [patchWorkspace]);

  const addMember = useCallback(async (workspaceId: string, input: AddMemberInput) => {
    try {
      const member = await workspacesApi.addMember(workspaceId, input);
      setMembers(prev => ({
        ...prev,
        [workspaceId]: [...(prev[workspaceId] || []), member]
      }));
      patchWorkspace(workspaceId, (w) => ({ memberCount: (w.memberCount || 0) + 1 }));
      toast.success('Member added successfully');
    } catch (error) {
      console.error('Failed to add member:', error);
      toast.error('Failed to add member');
      throw error;
    }
  }, [patchWorkspace]);

  const updateMemberRole = useCallback(async (workspaceId: string, memberId: string, input: UpdateMemberRoleInput) => {
    try {
      const updated = await workspacesApi.updateMemberRole(workspaceId, memberId, input);
      setMembers(prev => ({
        ...prev,
        [workspaceId]: (prev[workspaceId] || []).map(m => m.id === memberId ? updated : m)
      }));
      toast.success('Member role updated');
    } catch (error) {
      console.error('Failed to update member role:', error);
      toast.error('Failed to update member role');
      throw error;
    }
  }, []);

  const removeMember = useCallback(async (workspaceId: string, memberId: string) => {
    try {
      await workspacesApi.removeMember(workspaceId, memberId);
      setMembers(prev => ({
        ...prev,
        [workspaceId]: (prev[workspaceId] || []).filter(m => m.id !== memberId)
      }));
      patchWorkspace(workspaceId, (w) => ({ memberCount: Math.max((w.memberCount || 1) - 1, 0) }));
      toast.success('Member removed');
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error('Failed to remove member');
      throw error;
    }
  }, [patchWorkspace]);

  const refreshRecentItems = useCallback(async (workspaceId: string, silent = false) => {
    if (!silent) setItemsLoading(true);
    try {
      const items = await knowledgeApi.getRecentItems(workspaceId, 10);
      setRecentItems(items);
    } catch (error) {
      console.error('Failed to fetch recent items:', error);
    } finally {
      if (!silent) setItemsLoading(false);
    }
  }, []);

  const createKnowledgeItem = useCallback(async (workspaceId: string, input: CreateKnowledgeItemInput) => {
    try {
      const item = await knowledgeApi.createItem(workspaceId, input);
      setRecentItems(prev => [item, ...prev].slice(0, 10));
      patchWorkspace(workspaceId, (w) => ({ itemCount: (w.itemCount || 0) + 1 }));
      toast.success('Link added successfully');
      return item;
    } catch (error) {
      console.error('Failed to create knowledge item:', error);
      toast.error('Failed to add link');
      throw error;
    }
  }, [patchWorkspace]);

  const updateKnowledgeItem = useCallback(async (workspaceId: string, itemId: string, input: { userIntent?: string }) => {
    try {
      const updatedItem = await knowledgeApi.updateItem(workspaceId, itemId, input);
      setRecentItems(prev => prev.map(i => i.id === itemId ? updatedItem : i));
      toast.success('Item updated successfully');
    } catch (error) {
      console.error('Failed to update knowledge item:', error);
      toast.error('Failed to update item');
      throw error;
    }
  }, []);

  const deleteKnowledgeItem = useCallback(async (workspaceId: string, itemId: string) => {
    try {
      await knowledgeApi.deleteItem(workspaceId, itemId);
      setRecentItems(prev => prev.filter(i => i.id !== itemId));
      patchWorkspace(workspaceId, (w) => ({ itemCount: Math.max((w.itemCount || 1) - 1, 0) }));
      toast.success('Link deleted');
    } catch (error) {
      console.error('Failed to delete knowledge item:', error);
      toast.error('Failed to delete link');
      throw error;
    }
  }, [patchWorkspace]);

  useEffect(() => {
    if (user) {
      refreshWorkspaces();
    }
  }, [user, refreshWorkspaces]);

  // Fallback poll for processing items. WorkspaceRealtimeSync refreshes on the
  // server's knowledge:updated event, so this only has to cover a dropped socket,
  // which is why it is a slow safety net rather than a 3s loop.
  useEffect(() => {
    if (!currentWorkspaceId) return;

    const hasProcessingItems = recentItems.some(
      item => item.status === 'PROCESSING' || item.status === 'PENDING'
    );

    if (hasProcessingItems) {
      const interval = setInterval(() => {
        refreshRecentItems(currentWorkspaceId, true);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [recentItems, currentWorkspaceId, refreshRecentItems]);

  // Load items and members when current workspace changes. This is the only place
  // that fetches them on selection; pages must not repeat it.
  useEffect(() => {
    if (currentWorkspaceId) {
      refreshRecentItems(currentWorkspaceId);
      refreshMembers(currentWorkspaceId);
    } else {
      setRecentItems([]);
    }
  }, [currentWorkspaceId, refreshRecentItems, refreshMembers]);

  const value = {
    workspaces,
    currentWorkspace,
    members,
    recentItems,
    loading,
    itemsLoading,
    setCurrentWorkspace,
    refreshWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    refreshMembers,
    addMember,
    updateMemberRole,
    removeMember,
    refreshRecentItems,
    createKnowledgeItem,
    updateKnowledgeItem,
    deleteKnowledgeItem,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
