import { apiClient } from './client';
import type { ApiResponse } from '@/src/types/workspace';

export interface Space {
  id: string;
  name: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpaceElement {
  id: string;
  spaceId: string;
  type: string;
  content: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface SpaceWithElements extends Space {
  elements: SpaceElement[];
}

export interface CreateSpaceInput {
  name: string;
}

export interface CreateElementInput {
  type: string;
  content: unknown;
}

export interface UpdateElementInput {
  content: unknown;
}

export const spacesApi = {
  async getSpaces(workspaceId: string): Promise<Space[]> {
    const response = await apiClient.get<ApiResponse<Space[]>>(
      `/api/v1/workspaces/${workspaceId}/spaces`
    );
    return response.data;
  },

  async getSpace(workspaceId: string, spaceId: string): Promise<SpaceWithElements> {
    const response = await apiClient.get<ApiResponse<SpaceWithElements>>(
      `/api/v1/workspaces/${workspaceId}/spaces/${spaceId}`
    );
    return response.data;
  },

  async createSpace(workspaceId: string, input: CreateSpaceInput): Promise<Space> {
    const response = await apiClient.post<ApiResponse<Space>>(
      `/api/v1/workspaces/${workspaceId}/spaces`,
      input
    );
    return response.data;
  },

  async deleteSpace(workspaceId: string, spaceId: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(
      `/api/v1/workspaces/${workspaceId}/spaces/${spaceId}`
    );
  },

  async createElement(
    workspaceId: string,
    spaceId: string,
    input: CreateElementInput
  ): Promise<SpaceElement> {
    const response = await apiClient.post<ApiResponse<SpaceElement>>(
      `/api/v1/workspaces/${workspaceId}/spaces/${spaceId}/elements`,
      input
    );
    return response.data;
  },

  async updateElement(
    workspaceId: string,
    spaceId: string,
    elementId: string,
    input: UpdateElementInput
  ): Promise<SpaceElement> {
    const response = await apiClient.patch<ApiResponse<SpaceElement>>(
      `/api/v1/workspaces/${workspaceId}/spaces/${spaceId}/elements/${elementId}`,
      input
    );
    return response.data;
  },


  async deleteElement(
    workspaceId: string,
    spaceId: string,
    elementId: string
  ): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(
      `/api/v1/workspaces/${workspaceId}/spaces/${spaceId}/elements/${elementId}`
    );
  },

  async batchCreateElements(
    workspaceId: string,
    spaceId: string,
    elements: CreateElementInput[]
  ): Promise<SpaceElement[]> {
    const promises = elements.map((element) =>
      this.createElement(workspaceId, spaceId, element)
    );
    return Promise.all(promises);
  },
};