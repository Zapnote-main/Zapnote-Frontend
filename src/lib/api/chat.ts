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
  // Create a new conversation
  async createConversation(workspaceId: string, input: CreateConversationInput): Promise<Conversation> {
    const response = await apiClient.post<ApiResponse<Conversation>>(
      `/api/v1/workspaces/${workspaceId}/chat`,
      input
    );
    return response.data;
  },

  // Get all conversations for a workspace
  async getConversations(workspaceId: string): Promise<Conversation[]> {
    const response = await apiClient.get<ApiResponse<Conversation[]>>(
      `/api/v1/workspaces/${workspaceId}/chat`
    );
    return response.data;
  },

  // Get a specific conversation with messages
  async getConversation(workspaceId: string, conversationId: string, limit = 50): Promise<Conversation> {
    const response = await apiClient.get<ApiResponse<Conversation>>(
      `/api/v1/workspaces/${workspaceId}/chat/${conversationId}?limit=${limit}`
    );
    return response.data;
  },

  // Send a message in a conversation
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

  // Delete a conversation
  async deleteConversation(workspaceId: string, conversationId: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(
      `/api/v1/workspaces/${workspaceId}/chat/${conversationId}`
    );
  },

  // Stream a message (for real-time responses)
  async streamMessage(
    workspaceId: string,
    conversationId: string,
    input: SendMessageInput,
    onChunk: (chunk: string) => void
  ): Promise<Message> {
    // This would use EventSource or fetch with streaming
    // For now, we'll use regular API and simulate streaming
    const message = await this.sendMessage(workspaceId, conversationId, input);
    
    // Simulate streaming by breaking content into chunks
    const content = message.content;
    const chunkSize = 5;
    let currentIndex = 0;

    return new Promise<Message>((resolve) => {
      const streamInterval = setInterval(() => {
        if (currentIndex < content.length) {
          const chunk = content.slice(currentIndex, currentIndex + chunkSize);
          onChunk(content.slice(0, currentIndex + chunk.length));
          currentIndex += chunkSize;
        } else {
          clearInterval(streamInterval);
          resolve(message);
        }
      }, 30);
    });
  },
};