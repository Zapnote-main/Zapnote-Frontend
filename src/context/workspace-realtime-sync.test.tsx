import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceRealtimeSync } from "./workspace-realtime-sync";

type Listener = (...args: unknown[]) => void;

const mocks = vi.hoisted(() => ({
  socket: null as { on: ReturnType<typeof vi.fn>; off: ReturnType<typeof vi.fn> } | null,
  workspace: {
    currentWorkspace: { id: "workspace-1" } as { id: string } | null,
    refreshRecentItems: vi.fn(),
  },
}));

vi.mock("@/src/context/socket-context", () => ({
  useSocket: () => ({ socket: mocks.socket }),
}));

vi.mock("@/src/context/workspace-context", () => ({
  useWorkspace: () => mocks.workspace,
}));

function createSocket() {
  const listeners = new Map<string, Listener>();

  return {
    on: vi.fn((event: string, listener: Listener) => listeners.set(event, listener)),
    off: vi.fn((event: string, listener: Listener) => {
      if (listeners.get(event) === listener) listeners.delete(event);
    }),
    dispatch(event: string) {
      listeners.get(event)?.();
    },
  };
}

describe("WorkspaceRealtimeSync", () => {
  beforeEach(() => {
    mocks.socket = createSocket();
    mocks.workspace.currentWorkspace = { id: "workspace-1" };
    mocks.workspace.refreshRecentItems.mockReset();
  });

  it.each(["knowledge:created", "knowledge:updated", "knowledge:deleted"])(
    "silently refreshes recent items when %s arrives",
    (event) => {
      render(<WorkspaceRealtimeSync />);

      (mocks.socket as ReturnType<typeof createSocket>).dispatch(event);

      expect(mocks.workspace.refreshRecentItems).toHaveBeenCalledWith("workspace-1", true);
    },
  );

  it("removes all listeners when unmounted", () => {
    const view = render(<WorkspaceRealtimeSync />);
    const socket = mocks.socket as ReturnType<typeof createSocket>;

    view.unmount();
    socket.dispatch("knowledge:updated");

    expect(socket.off).toHaveBeenCalledTimes(3);
    expect(mocks.workspace.refreshRecentItems).not.toHaveBeenCalled();
  });

  it("does not subscribe when a workspace has not been selected", () => {
    mocks.workspace.currentWorkspace = null;

    render(<WorkspaceRealtimeSync />);

    expect(mocks.socket?.on).not.toHaveBeenCalled();
  });
});
