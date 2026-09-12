import { apiClient } from './client';
import type { Conversation, SendMessageResult } from '@/src/types/chat.types';
import type { ApiResponse } from '@/src/types/workspace';

export interface CreateConversationInput {
  title?: string;
  workspaceId?: string;
  sourceItemId?: string;
}

export interface SendMessageInput {
  message: string;
  sourceItemIds?: string[];
}

export const chatApi = {
  async createConversation(workspaceId: string, input: CreateConversationInput): Promise<Conversation> {
    const response = await apiClient.post<ApiResponse<Conversation>>(
      `/api/v1/workspaces/${workspaceId}/chat`,
      input
    );
    return response.data;
  },

  async getConversations(workspaceId: string): Promise<Conversation[]> {
    const response = await apiClient.get<ApiResponse<Conversation[]>>(
      `/api/v1/workspaces/${workspaceId}/chat`
    );
    return response.data;
  },

  async getConversation(workspaceId: string, conversationId: string, limit = 50): Promise<Conversation> {
    const response = await apiClient.get<ApiResponse<Conversation>>(
      `/api/v1/workspaces/${workspaceId}/chat/${conversationId}?limit=${limit}`
    );
    return response.data;
  },

  /** Returns both the persisted user message and the assistant's reply. */
  async sendMessage(
    workspaceId: string,
    conversationId: string,
    input: SendMessageInput
  ): Promise<SendMessageResult> {
    const response = await apiClient.post<ApiResponse<SendMessageResult>>(
      `/api/v1/workspaces/${workspaceId}/chat/${conversationId}/messages`,
      input
    );
    return response.data;
  },

  async deleteConversation(workspaceId: string, conversationId: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(
      `/api/v1/workspaces/${workspaceId}/chat/${conversationId}`
    );
  },
};
