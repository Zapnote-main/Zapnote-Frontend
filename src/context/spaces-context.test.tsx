import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SpacesProvider, useSpaces } from "./spaces-context";

type Listener = (payload: unknown) => void;

const mocks = vi.hoisted(() => ({
  socket: null as { on: ReturnType<typeof vi.fn>; off: ReturnType<typeof vi.fn> } | null,
  getSpaces: vi.fn(),
  toastInfo: vi.fn(),
  workspace: { currentWorkspace: { id: "workspace-1" } },
}));

vi.mock("@/src/context/socket-context", () => ({
  useSocket: () => ({ socket: mocks.socket }),
}));

vi.mock("@/src/context/workspace-context", () => ({
  useWorkspace: () => mocks.workspace,
}));

vi.mock("@/src/lib/api/spaces", () => ({
  spacesApi: { getSpaces: mocks.getSpaces },
}));

vi.mock("sonner", () => ({
  toast: { info: mocks.toastInfo, error: vi.fn(), success: vi.fn() },
}));

function createSocket() {
  const listeners = new Map<string, Listener>();

  return {
    on: vi.fn((event: string, listener: Listener) => listeners.set(event, listener)),
    off: vi.fn((event: string, listener: Listener) => {
      if (listeners.get(event) === listener) listeners.delete(event);
    }),
    dispatch(event: string, payload: unknown) {
      listeners.get(event)?.(payload);
    },
  };
}

function SpaceState() {
  const { spaces, currentSpace } = useSpaces();
  return <output>{`${spaces.map((space) => space.id).join(",")}|${currentSpace?.id ?? "none"}`}</output>;
}

describe("SpacesProvider real-time events", () => {
  beforeEach(() => {
    mocks.socket = createSocket();
    mocks.getSpaces.mockResolvedValue([{ id: "space-1", name: "First", workspaceId: "workspace-1" }]);
    mocks.toastInfo.mockReset();
  });

  it("adds a remotely created space once and ignores duplicate deliveries", async () => {
    render(
      <SpacesProvider>
        <SpaceState />
      </SpacesProvider>,
    );

    await screen.findByText("space-1|space-1");
    const socket = mocks.socket as ReturnType<typeof createSocket>;
    const space = { id: "space-2", name: "Second", workspaceId: "workspace-1" };

    act(() => socket.dispatch("space:created", space));
    await screen.findByText("space-1,space-2|space-1");

    act(() => socket.dispatch("space:created", space));
    expect(screen.getByText("space-1,space-2|space-1")).toBeInTheDocument();
  });

  it("removes the active space and tells the collaborator when it is deleted remotely", async () => {
    render(
      <SpacesProvider>
        <SpaceState />
      </SpacesProvider>,
    );

    await screen.findByText("space-1|space-1");
    act(() =>
      (mocks.socket as ReturnType<typeof createSocket>).dispatch("space:deleted", { spaceId: "space-1" }),
    );

    await waitFor(() => expect(screen.getByText("|none")).toBeInTheDocument());
    expect(mocks.toastInfo).toHaveBeenCalledWith("This space was deleted by another user");
  });

  it("ignores malformed space events", async () => {
    render(
      <SpacesProvider>
        <SpaceState />
      </SpacesProvider>,
    );

    await screen.findByText("space-1|space-1");
    const socket = mocks.socket as ReturnType<typeof createSocket>;
    act(() => {
      socket.dispatch("space:created", {});
      socket.dispatch("space:deleted", {});
    });

    expect(screen.getByText("space-1|space-1")).toBeInTheDocument();
  });
});
