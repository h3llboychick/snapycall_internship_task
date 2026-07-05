// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../App.jsx";

const user = {
  id: "00000000-0000-4000-8000-000000000500",
  name: "Client with 500 credits",
  credits: 500
};

const expert = {
  id: "00000000-0000-4000-8000-000000001001",
  name: "Ada Expert"
};

const slot = {
  id: "00000000-0000-4000-8000-000000002001",
  expertId: expert.id,
  startsAt: "2030-01-15T09:00:00.000Z",
  endsAt: "2030-01-15T09:30:00.000Z"
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("loads users and displays the selected user's bookings", async () => {
    const fetchMock = vi.fn(async (path) => {
      if (path === "/api/clients") {
        return {
          ok: true,
          json: async () => [user]
        };
      }

      if (path === "/api/experts") {
        return {
          ok: true,
          json: async () => [expert]
        };
      }

      if (path === `/api/clients/${user.id}/bookings`) {
        return {
          ok: true,
          json: async () => []
        };
      }

      if (path === `/api/experts/${expert.id}/slots`) {
        return {
          ok: true,
          json: async () => [slot]
        };
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    const userSelect = await screen.findByLabelText("User");

    await screen.findByRole("option", {
      name: "Client with 500 credits — 500 credits"
    });

    fireEvent.change(userSelect, {
      target: {
        value: user.id
      }
    });

    expect(
      await screen.findByText("Available balance:", { exact: false })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/clients/${user.id}/bookings`,
        {
          signal: expect.any(AbortSignal)
        }
      );
    });

    const expertSelect = screen.getByLabelText("Expert");
    fireEvent.change(expertSelect, {
      target: {
        value: expert.id
      }
    });

    expect(
      await screen.findByRole("option", {
        name: /Jan 15, 2030/
      })
    ).toBeInTheDocument();
  });
});
