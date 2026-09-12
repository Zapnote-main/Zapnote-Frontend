import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, act, waitFor, screen } from '@testing-library/react';

// jsdom has no layout, so scrollIntoView is absent. Not an app concern.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {};
}

const CONV = { id: 'c1', title: 'T', userId: 'u1', workspaceId: 'w1', createdAt: '', updatedAt: '' };

// Exactly the shape the API returns: two messages, not one.
const USER_MSG = {
  id: 'm-user-1', conversationId: 'c1', role: 'user' as const,
  content: 'what is in my workspace?', sourceItemIds: [], createdAt: '2026-01-01T00:00:00Z',
};
const ASSISTANT_MSG = {
  id: 'm-asst-1', conversationId: 'c1', role: 'assistant' as const,
  content: 'Here is a fairly long answer that should be revealed progressively rather than appearing all at once in a single frame.',
  sourceItemIds: ['k1'], createdAt: '2026-01-01T00:00:01Z',
  sources: [{ id: 'k1', sourceUrl: 'https://example.com/a', title: 'A Real Article Title' }],
};

const getConversations = vi.fn(async () => [CONV]);
const HISTORY = [
  { id: 'm-old-1', conversationId: 'c1', role: 'user' as const, content: 'earlier question', sourceItemIds: [], createdAt: '2025-12-31T00:00:00Z' },
  { id: 'm-old-2', conversationId: 'c1', role: 'assistant' as const, content: 'earlier answer', sourceItemIds: [], createdAt: '2025-12-31T00:00:01Z' },
];
// Resolves on a later tick, like a real request would. With an instantly resolved
// promise React can coalesce renders and hide a bad intermediate list entry.
const getConversation = vi.fn(async () => {
  await new Promise((r) => setTimeout(r, 20));
  return { ...CONV, messages: HISTORY };
});
const sendMessage = vi.fn(async () => ({ userMessage: USER_MSG, assistantMessage: ASSISTANT_MSG }));
const createConversation = vi.fn(async () => CONV);

vi.mock('@/src/lib/api/chat', () => ({
  chatApi: {
    getConversations: () => getConversations(),
    getConversation: () => getConversation(),
    sendMessage: () => sendMessage(),
    createConversation: () => createConversation(),
    deleteConversation: vi.fn(),
  },
}));

const AUTH = { user: { uid: 'u1', displayName: 'Ada', email: 'ada@x.y' } };
vi.mock('@/src/context/auth-context', () => ({ useAuth: () => AUTH }));

const WORKSPACE = { currentWorkspace: { id: 'w1', name: 'W' } };
vi.mock('@/src/context/workspace-context', () => ({ useWorkspace: () => WORKSPACE }));

const SIDEBAR = { state: 'expanded' as const };
vi.mock('@/src/components/ui/sidebar', () => ({ useSidebar: () => SIDEBAR }));

const CHAT_UI = { isHistoryOpen: false, setIsHistoryOpen: vi.fn() };
vi.mock('@/src/context/chat-ui-context', () => ({ useChatUI: () => CHAT_UI }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

// Streamdown pulls in shiki; render its text directly so the test stays fast.
vi.mock('streamdown', () => ({
  Streamdown: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}));

// Capture what AI_Prompt is handed so the test can drive a send.
let sendFromPrompt: ((c: string) => void) | null = null;
vi.mock('@/src/components/console/chat/ai-prompt', () => ({
  default: ({ onSendMessage }: { onSendMessage?: (c: string) => void }) => {
    if (onSendMessage) sendFromPrompt = onSendMessage;
    return <div data-testid="prompt" />;
  },
}));

const { ChatInterface } = await import('@/src/components/console/chat/chat-interface');

// React logs the missing-key warning through console.error.
function captureKeyWarnings() {
  const warnings: string[] = [];
  const spy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    const text = args.map(String).join(' ');
    if (text.includes('unique "key"') || text.includes('unique key')) warnings.push(text);
  });
  return { warnings, restore: () => spy.mockRestore() };
}

describe('ChatInterface message handling', () => {
  beforeEach(() => {
    sendFromPrompt = null;
    sendMessage.mockClear();
    getConversation.mockClear();
    getConversations.mockClear();
  });

  it('renders a reply without a missing-key warning and without refetching', async () => {
    const { warnings, restore } = captureKeyWarnings();

    render(<ChatInterface chatContext={{ type: 'workspace', workspaceId: 'w1' }} conversationId="c1" />);
    await waitFor(() => expect(sendFromPrompt).not.toBeNull());

    const refetchesBefore = getConversation.mock.calls.length;

    await act(async () => { sendFromPrompt!('what is in my workspace?'); });
    // Cover the full reveal animation.
    await act(async () => { await new Promise((r) => setTimeout(r, 1200)); });

    expect(sendMessage).toHaveBeenCalledTimes(1);
    if (warnings.length) console.log("CAPTURED WARNINGS:", JSON.stringify(warnings, null, 2).slice(0, 1200));
    expect(warnings).toEqual([]);
    // The old code re-fetched the whole conversation after every send; that extra
    // round trip is what read as the page reloading.
    expect(getConversation.mock.calls.length).toBe(refetchesBefore);

    restore();
  });

  it('shows the assistant reply text after sending', async () => {
    render(<ChatInterface chatContext={{ type: 'workspace', workspaceId: 'w1' }} conversationId="c1" />);
    await waitFor(() => expect(sendFromPrompt).not.toBeNull());

    await act(async () => { sendFromPrompt!('hello'); });
    await act(async () => { await new Promise((r) => setTimeout(r, 1200)); });

    expect(screen.getByText(ASSISTANT_MSG.content)).toBeTruthy();
    // And exactly once: revealed copy must be replaced by the committed message,
    // not left alongside it.
    expect(screen.getAllByText(ASSISTANT_MSG.content)).toHaveLength(1);
  });

  it('reveals the reply progressively rather than in one frame', async () => {
    render(<ChatInterface chatContext={{ type: 'workspace', workspaceId: 'w1' }} conversationId="c1" />);
    await waitFor(() => expect(sendFromPrompt).not.toBeNull());

    await act(async () => { sendFromPrompt!('hello'); });

    // Partway through the reveal the text should be present but incomplete.
    await act(async () => { await new Promise((r) => setTimeout(r, 120)); });
    const partial = document.body.textContent ?? '';
    const sawPartial =
      partial.includes(ASSISTANT_MSG.content.slice(0, 10)) &&
      !partial.includes(ASSISTANT_MSG.content);

    await act(async () => { await new Promise((r) => setTimeout(r, 1200)); });
    expect(document.body.textContent).toContain(ASSISTANT_MSG.content);
    expect(sawPartial).toBe(true);
  });

  it('renders the source title instead of the word Link', async () => {
    render(<ChatInterface chatContext={{ type: 'workspace', workspaceId: 'w1' }} conversationId="c1" />);
    await waitFor(() => expect(sendFromPrompt).not.toBeNull());

    await act(async () => { sendFromPrompt!('hello'); });
    await act(async () => { await new Promise((r) => setTimeout(r, 1200)); });

    expect(screen.getByText('A Real Article Title')).toBeTruthy();
  });

  it('drops the optimistic message when the send fails', async () => {
    sendMessage.mockRejectedValueOnce(new Error('boom'));

    render(<ChatInterface chatContext={{ type: 'workspace', workspaceId: 'w1' }} conversationId="c1" />);
    await waitFor(() => expect(sendFromPrompt).not.toBeNull());

    await act(async () => { sendFromPrompt!('this will fail'); });
    await act(async () => { await new Promise((r) => setTimeout(r, 300)); });

    expect(document.body.textContent).not.toContain('this will fail');
  });
});
