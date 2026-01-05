"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
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

  const setCurrentWorkspace = useCallback((workspace: WorkspaceWithRole | null) => {
    setCurrentWorkspaceState(workspace);
    if (workspace) {
      localStorage.setItem('currentWorkspaceId', workspace.id);
    } else {
      localStorage.removeItem('currentWorkspaceId');
    }
  }, []);

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
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspace(updated);
      }
      toast.success('Workspace updated successfully');
    } catch (error) {
      console.error('Failed to update workspace:', error);
      toast.error('Failed to update workspace');
      throw error;
    }
  }, [currentWorkspace]);

  const deleteWorkspace = useCallback(async (workspaceId: string) => {
    try {
      await workspacesApi.deleteWorkspace(workspaceId);
      setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspace(null);
      }
      toast.success('Workspace deleted successfully');
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      toast.error('Failed to delete workspace');
      throw error;
    }
  }, [currentWorkspace]);

  const refreshMembers = useCallback(async (workspaceId: string) => {
    try {
      const data = await workspacesApi.getMembers(workspaceId);
      setMembers(prev => ({ ...prev, [workspaceId]: data }));
      // update member count on workspace object if available
      setWorkspaces(prev => prev.map(w => w.id === workspaceId ? { ...w, memberCount: data.length } : w));
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspaceState(prev => prev ? { ...prev, memberCount: data.length } : prev as any);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
      toast.error('Failed to load members');
    }
  }, []);

  const addMember = useCallback(async (workspaceId: string, input: AddMemberInput) => {
    try {
      const member = await workspacesApi.addMember(workspaceId, input);
      setMembers(prev => ({
        ...prev,
        [workspaceId]: [...(prev[workspaceId] || []), member]
      }));
      // increment member count for the workspace
      setWorkspaces(prev => prev.map(w => w.id === workspaceId ? { ...w, memberCount: (w.memberCount || 0) + 1 } : w));
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspaceState(prev => prev ? { ...prev, memberCount: (prev.memberCount || 0) + 1 } : prev as any);
      }
      toast.success('Member added successfully');
    } catch (error) {
      console.error('Failed to add member:', error);
      toast.error('Failed to add member');
      throw error;
    }
  }, []);

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
      // decrement member count for the workspace
      setWorkspaces(prev => prev.map(w => w.id === workspaceId ? { ...w, memberCount: Math.max((w.memberCount || 1) - 1, 0) } : w));
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspaceState(prev => prev ? { ...prev, memberCount: Math.max((prev.memberCount || 1) - 1, 0) } : prev as any);
      }
      toast.success('Member removed');
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error('Failed to remove member');
      throw error;
    }
  }, []);

  const refreshRecentItems = useCallback(async (workspaceId: string, silent = false) => {
    if (!silent) setItemsLoading(true);
    try {
      const items = await knowledgeApi.getRecentItems(workspaceId, 10);
      setRecentItems(items);
      // update item count on workspace if the workspace is present
      setWorkspaces(prev => prev.map(w => w.id === workspaceId ? { ...w, itemCount: Math.max(items.length, w.itemCount || 0) } : w));
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspaceState(prev => prev ? { ...prev, itemCount: Math.max(items.length, prev.itemCount || 0) } : prev as any);
      }
    } catch (error) {
      console.error('Failed to fetch recent items:', error);
    } finally {
      if (!silent) setItemsLoading(false);
    }
  }, [currentWorkspace]);

  const createKnowledgeItem = useCallback(async (workspaceId: string, input: CreateKnowledgeItemInput) => {
    try {
      const item = await knowledgeApi.createItem(workspaceId, input);
      setRecentItems(prev => [item, ...prev].slice(0, 10));
      // increment item count for the workspace
      setWorkspaces(prev => prev.map(w => w.id === workspaceId ? { ...w, itemCount: (w.itemCount || 0) + 1 } : w));
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspaceState(prev => prev ? { ...prev, itemCount: (prev.itemCount || 0) + 1 } : prev as any);
      }
      toast.success('Link added successfully');
      return item;
    } catch (error) {
      console.error('Failed to create knowledge item:', error);
      toast.error('Failed to add link');
      throw error;
    }
  }, []);

  const deleteKnowledgeItem = useCallback(async (workspaceId: string, itemId: string) => {
    try {
      await knowledgeApi.deleteItem(workspaceId, itemId);
      setRecentItems(prev => prev.filter(i => i.id !== itemId));
      // decrement item count for the workspace
      setWorkspaces(prev => prev.map(w => w.id === workspaceId ? { ...w, itemCount: Math.max((w.itemCount || 1) - 1, 0) } : w));
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspaceState(prev => prev ? { ...prev, itemCount: Math.max((prev.itemCount || 1) - 1, 0) } : prev as any);
      }
      toast.success('Link deleted');
    } catch (error) {
      console.error('Failed to delete knowledge item:', error);
      toast.error('Failed to delete link');
      throw error;
    }
  }, []);

  useEffect(() => {
    if (user) {
      refreshWorkspaces();
    }
  }, [user, refreshWorkspaces]);

  // Poll for processing items
  useEffect(() => {
    if (!currentWorkspace) return;

    const hasProcessingItems = recentItems.some(
      item => item.status === 'PROCESSING' || item.status === 'PENDING'
    );

    if (hasProcessingItems) {
      const interval = setInterval(() => {
        refreshRecentItems(currentWorkspace.id, true);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [recentItems, currentWorkspace, refreshRecentItems]);

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