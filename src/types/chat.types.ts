export type MessageRole = 'user' | 'assistant' | 'system';

export interface MessageSource {
  id: string;
  sourceUrl: string;
  /** The API sends `title`, falling back to the item's summary or URL. */
  title?: string;
  summary?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  sourceItemIds?: string[];
  createdAt: string;
  sources?: MessageSource[];
}

/**
 * POST /chat/:id/messages persists the user's message and the generated reply and
 * returns both. Treating this as a single Message silently produced an object with
 * no `id` and no `content`, which broke list keys and rendered an empty bubble.
 */
export interface SendMessageResult {
  userMessage: Message;
  assistantMessage: Message;
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
