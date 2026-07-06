// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";
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

const booking = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  clientId: user.id,
  expertId: expert.id,
  slotId: slot.id,
  status: "CONFIRMED",
  createdAt: "2026-07-06T12:00:00.000Z"
};

afterEach(() => {
  cleanup();
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

  it("preserves booking success and reports refresh failures independently", async () => {
    const getCounts = new Map();

    const fetchMock = vi.fn(async (path, options = {}) => {
      if (options.method === "POST" && path === "/api/bookings") {
        return {
          ok: true,
          json: async () => booking
        };
      }

      const requestCount = (getCounts.get(path) ?? 0) + 1;
      getCounts.set(path, requestCount);

      if (path === "/api/clients" && requestCount === 1) {
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

      if (
        path === `/api/clients/${user.id}/bookings` &&
        requestCount === 1
      ) {
        return {
          ok: true,
          json: async () => []
        };
      }

      if (
        path === `/api/experts/${expert.id}/slots` &&
        requestCount === 1
      ) {
        return {
          ok: true,
          json: async () => [slot]
        };
      }

      return {
        ok: false,
        status: 503,
        json: async () => ({
          error: {
            code: "TEMPORARILY_UNAVAILABLE",
            message: `Could not refresh ${path}.`
          }
        })
      };
    });

    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    fireEvent.change(await screen.findByLabelText("User"), {
      target: {
        value: user.id
      }
    });
    fireEvent.change(await screen.findByLabelText("Expert"), {
      target: {
        value: expert.id
      }
    });

    const slotOption = await screen.findByRole("option", {
      name: /Jan 15, 2030/
    });
    fireEvent.change(screen.getByLabelText("Available slot"), {
      target: {
        value: slotOption.value
      }
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Book consultation"
      })
    );

    expect(
      await screen.findByText(`Booking ${booking.id} is confirmed.`)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/users could not be refreshed/)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/bookings could not be refreshed/)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/slots could not be refreshed/)
    ).toBeInTheDocument();
  });
});
