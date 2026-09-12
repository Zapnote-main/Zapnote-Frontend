import { act, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SocketProvider } from "./socket-context";

type Listener = (...args: unknown[]) => void;

const mocks = vi.hoisted(() => ({
  currentWorkspaceId: "workspace-1",
  user: {
    uid: "user-1",
    getIdToken: vi.fn().mockResolvedValue("token"),
  },
  io: vi.fn(),
}));

vi.mock("socket.io-client", () => ({ io: mocks.io }));
vi.mock("./auth-context", () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock("./workspace-context", () => ({
  useWorkspace: () => ({ currentWorkspace: { id: mocks.currentWorkspaceId } }),
}));

function createSocket() {
  const listeners = new Map<string, Set<Listener>>();
  const socket = {
    connected: false,
    on: vi.fn((event: string, listener: Listener) => {
      const eventListeners = listeners.get(event) ?? new Set<Listener>();
      eventListeners.add(listener);
      listeners.set(event, eventListeners);
      return socket;
    }),
    off: vi.fn((event: string, listener?: Listener) => {
      if (listener) listeners.get(event)?.delete(listener);
      else listeners.delete(event);
      return socket;
    }),
    emit: vi.fn(),
    disconnect: vi.fn(),
    dispatch(event: string) {
      for (const listener of listeners.get(event) ?? []) listener();
    },
  };
  return socket;
}

describe("SocketProvider workspace room membership", () => {
  beforeEach(() => {
    mocks.currentWorkspaceId = "workspace-1";
    mocks.user.getIdToken.mockClear();
    mocks.io.mockReset();
  });

  it("subscribes after connecting, re-subscribes after reconnecting, and unsubscribes on cleanup", async () => {
    const socket = createSocket();
    mocks.io.mockReturnValue(socket);
    const view = render(
      <SocketProvider>
        <div />
      </SocketProvider>,
    );

    await waitFor(() => expect(mocks.io).toHaveBeenCalledTimes(1));
    act(() => {
      socket.connected = true;
      socket.dispatch("connect");
      socket.dispatch("connect");
    });

    expect(socket.emit).toHaveBeenCalledWith("subscribe:workspace", "workspace-1");
    expect(socket.emit).toHaveBeenCalledTimes(2);

    view.unmount();

    expect(socket.emit).toHaveBeenLastCalledWith("unsubscribe:workspace", "workspace-1");
    expect(socket.disconnect).toHaveBeenCalledOnce();
  });
});
