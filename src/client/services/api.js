class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

async function request(path, options = {}) {
  const response = await fetch(path, options);
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      body?.error?.message ?? "The request failed.",
      body?.error?.code ?? "REQUEST_FAILED",
      response.status
    );
  }

  return body;
}

export function getUsers(signal) {
  return request("/api/clients", { signal });
}

export function getExperts(signal) {
  return request("/api/experts", { signal });
}

export function getAvailableSlots(expertId, signal) {
  return request(`/api/experts/${encodeURIComponent(expertId)}/slots`, {
    signal
  });
}

export function getUserBookings(userId, signal) {
  return request(`/api/clients/${encodeURIComponent(userId)}/bookings`, {
    signal
  });
}

export function createBooking(payload) {
  return request("/api/bookings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export function getBooking(bookingId) {
  return request(`/api/bookings/${encodeURIComponent(bookingId)}`);
}
