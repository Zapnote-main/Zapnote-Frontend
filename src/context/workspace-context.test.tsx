import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, waitFor, act } from '@testing-library/react';

const WS = [
  { id: 'w1', name: 'One', ownerId: 'u1', createdAt: '', updatedAt: '', role: 'OWNER', memberCount: 3, itemCount: 24 },
  { id: 'w2', name: 'Two', ownerId: 'u1', createdAt: '', updatedAt: '', role: 'EDITOR', memberCount: 1, itemCount: 2 },
];
const MEMBERS = [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }];
const ITEMS = [{ id: 'i1', status: 'COMPLETED', createdAt: '2026-01-01T00:00:00Z' }];

const getWorkspaces = vi.fn(async () => WS);
const getMembers = vi.fn(async () => MEMBERS);
const getRecentItems = vi.fn(async () => ITEMS);
const addMemberApi = vi.fn(async () => ({ id: 'm4' }));

vi.mock('@/src/lib/api/workspaces', () => ({
  workspacesApi: {
    getWorkspaces: () => getWorkspaces(),
    getMembers: () => getMembers(),
    addMember: () => addMemberApi(),
    createWorkspace: vi.fn(),
    updateWorkspace: vi.fn(),
    deleteWorkspace: vi.fn(),
    updateMemberRole: vi.fn(),
    removeMember: vi.fn(),
  },
}));

vi.mock('@/src/lib/api/knowledge', () => ({
  knowledgeApi: {
    getRecentItems: () => getRecentItems(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
  },
}));

const AUTH = { user: { uid: 'u1' } };
vi.mock('@/src/context/auth-context', () => ({ useAuth: () => AUTH }));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const { WorkspaceProvider, useWorkspace } = await import('./workspace-context');

let ctx: any = null;
let renderCount = 0;
function Probe() {
  ctx = useWorkspace();
  renderCount++;
  return <div data-testid="ws">{ctx.currentWorkspace?.id ?? 'none'}</div>;
}

function mount() {
  return render(
    <WorkspaceProvider>
      <Probe />
    </WorkspaceProvider>
  );
}

describe('WorkspaceProvider fetch behaviour', () => {
  beforeEach(() => {
    getWorkspaces.mockClear();
    getMembers.mockClear();
    getRecentItems.mockClear();
    addMemberApi.mockClear();
    localStorage.clear();
    ctx = null;
    renderCount = 0;
  });

  it('fetches each resource exactly once on mount', async () => {
    const { getByTestId } = mount();
    await waitFor(() => expect(getByTestId('ws').textContent).toBe('w1'));

    // Let any cascading effects settle before counting.
    await act(async () => { await new Promise((r) => setTimeout(r, 300)); });

    expect(getWorkspaces).toHaveBeenCalledTimes(1);
    expect(getRecentItems).toHaveBeenCalledTimes(1);
    expect(getMembers).toHaveBeenCalledTimes(1);
  });

  it('does not loop after refreshMembers patches the workspace', async () => {
    const { getByTestId } = mount();
    await waitFor(() => expect(getByTestId('ws').textContent).toBe('w1'));
    await act(async () => { await new Promise((r) => setTimeout(r, 300)); });

    const membersBefore = getMembers.mock.calls.length;
    const itemsBefore = getRecentItems.mock.calls.length;

    await act(async () => { await ctx.refreshMembers('w1'); });
    await act(async () => { await new Promise((r) => setTimeout(r, 400)); });

    // The patch sets memberCount to the same value the list already had, so nothing
    // downstream should refire. One extra members call is the explicit one above.
    expect(getMembers.mock.calls.length).toBe(membersBefore + 1);
    expect(getRecentItems.mock.calls.length).toBe(itemsBefore);
  });

  it('keeps currentWorkspace identity stable when a patch changes nothing', async () => {
    const { getByTestId } = mount();
    await waitFor(() => expect(getByTestId('ws').textContent).toBe('w1'));
    await act(async () => { await new Promise((r) => setTimeout(r, 300)); });

    const before = ctx.currentWorkspace;
    await act(async () => { await ctx.refreshMembers('w1'); });
    await act(async () => { await new Promise((r) => setTimeout(r, 200)); });

    // memberCount was already 3 and getMembers returns 3, so the bail-out must
    // hand back the very same object rather than a new one.
    expect(ctx.currentWorkspace).toBe(before);
  });

  it('applies a real count change and reaches the current workspace', async () => {
    const { getByTestId } = mount();
    await waitFor(() => expect(getByTestId('ws').textContent).toBe('w1'));
    await act(async () => { await new Promise((r) => setTimeout(r, 300)); });

    expect(ctx.currentWorkspace.memberCount).toBe(3);

    // addMember bumps the count; the old code read a stale null currentWorkspace
    // here and silently skipped this update.
    await act(async () => { await ctx.addMember('w1', { email: 'x@y.z', role: 'VIEWER' }); });
    await act(async () => { await new Promise((r) => setTimeout(r, 200)); });

    expect(ctx.currentWorkspace.memberCount).toBe(4);
    expect(ctx.workspaces.find((w: any) => w.id === 'w1').memberCount).toBe(4);
  });

  it('settles instead of rendering forever', async () => {
    const { getByTestId } = mount();
    await waitFor(() => expect(getByTestId('ws').textContent).toBe('w1'));
    await act(async () => { await new Promise((r) => setTimeout(r, 600)); });

    const settled = renderCount;
    await act(async () => { await new Promise((r) => setTimeout(r, 600)); });
    expect(renderCount).toBe(settled);
  });
});
