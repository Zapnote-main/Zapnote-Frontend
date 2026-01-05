import { apiClient } from './client';
import type { Conversation, Message } from '@/src/types/chat.types';
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

  async sendMessage(
    workspaceId: string,
    conversationId: string,
    input: SendMessageInput
  ): Promise<Message> {
    const response = await apiClient.post<ApiResponse<Message>>(
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

  async streamMessage(
    workspaceId: string,
    conversationId: string,
    input: SendMessageInput,
    onChunk: (chunk: string) => void
  ): Promise<Message> {
    const message = await this.sendMessage(workspaceId, conversationId, input);
    
    const content = message.content || ""; 
    const chunkSize = 10; 
    let currentIndex = 0;

    return new Promise<Message>((resolve) => {
      if (content.length === 0) {
        resolve(message);
        return;
      }

      const streamInterval = setInterval(() => {
        if (currentIndex < content.length) {
          currentIndex = Math.min(currentIndex + chunkSize, content.length);
          onChunk(content.slice(0, currentIndex));
          
          if (currentIndex >= content.length) {
             clearInterval(streamInterval);
             resolve(message);
          }
        } else {
          clearInterval(streamInterval);
          resolve(message);
        }
      }, 20);
    });
  },
};