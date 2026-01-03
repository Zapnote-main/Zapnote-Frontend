export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  sourceItemIds?: string[];
  createdAt: string;
  sources?: Array<{
    id: string;
    sourceUrl: string;
    summary?: string;
  }>;
}

export interface Conversation {
  id: string;
  title: string;
  userId: string;
  workspaceId?: string;
  sourceItemId?: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
  lastMessage?: string;
}

export interface ChatContextType {
  workspaceId?: string;
  sourceItemId?: string;
  type: 'workspace' | 'link';
}