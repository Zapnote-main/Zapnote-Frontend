export type WorkspaceRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type ContentType = 'ARTICLE' | 'VIDEO' | 'DOCUMENT' | 'IMAGE' | 'OTHER';

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
}

export interface WorkspaceWithRole {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  role: WorkspaceRole;
  memberCount?: number;
  itemCount?: number;
}

export interface WorkspaceMemberWithUser {
  id: string;
  role: WorkspaceRole;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    username?: string;
    displayName?: string;
    photoURL?: string;
  };
}

export interface Tag {
  id: string;
  name: string;
  addedByAI?: boolean;
}

export interface KnowledgeItem {
  id: string;
  workspaceId: string;
  sourceUrl: string;
  userIntent?: string;
  summary?: string;
  contentType: ContentType;
  status: ProcessingStatus;
  tags?: (string | Tag)[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
}

export interface AddMemberInput {
  email: string;
  role: WorkspaceRole;
}

export interface UpdateMemberRoleInput {
  role: WorkspaceRole;
}

export interface CreateKnowledgeItemInput {
  sourceUrl: string;
  userIntent?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  type?: ContentType;
  status?: ProcessingStatus;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}