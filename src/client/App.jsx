import { useEffect, useMemo, useState } from "react";
import {
  createBooking,
  getAvailableSlots,
  getBooking,
  getExperts,
  getUserBookings,
  getUsers
} from "./services/api.js";

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    timeStyle: "short"
  }).format(new Date(value));
}

function App() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState("");

  const [experts, setExperts] = useState([]);
  const [selectedExpertId, setSelectedExpertId] = useState("");
  const [expertsLoading, setExpertsLoading] = useState(true);
  const [expertsError, setExpertsError] = useState("");

  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");

  const [bookingId, setBookingId] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [lookupResult, setLookupResult] = useState(null);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId),
    [selectedUserId, users]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadUsers() {
      try {
        setUsersLoading(true);
        setUsersError("");
        const result = await getUsers(controller.signal);
        setUsers(result);
      } catch (error) {
        if (error.name !== "AbortError") {
          setUsersError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setUsersLoading(false);
        }
      }
    }

    loadUsers();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadExperts() {
      try {
        setExpertsLoading(true);
        setExpertsError("");
        setExperts(await getExperts(controller.signal));
      } catch (error) {
        if (error.name !== "AbortError") {
          setExpertsError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setExpertsLoading(false);
        }
      }
    }

    loadExperts();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setBookings([]);
      setBookingsError("");
      return undefined;
    }

    const controller = new AbortController();

    async function loadBookings() {
      try {
        setBookingsLoading(true);
        setBookingsError("");
        const result = await getUserBookings(
          selectedUserId,
          controller.signal
        );
        setBookings(result);
      } catch (error) {
        if (error.name !== "AbortError") {
          setBookingsError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setBookingsLoading(false);
        }
      }
    }

    loadBookings();

    return () => controller.abort();
  }, [selectedUserId]);

  useEffect(() => {
    setSelectedSlotId("");

    if (!selectedExpertId) {
      setSlots([]);
      setSlotsError("");
      return undefined;
    }

    const controller = new AbortController();

    async function loadSlots() {
      try {
        setSlotsLoading(true);
        setSlotsError("");
        setSlots(
          await getAvailableSlots(selectedExpertId, controller.signal)
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          setSlotsError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSlotsLoading(false);
        }
      }
    }

    loadSlots();

    return () => controller.abort();
  }, [selectedExpertId]);

  async function handleCreateBooking(event) {
    event.preventDefault();

    if (!selectedUserId) {
      setBookingError("Select a user first.");
      return;
    }

    let booking;

    try {
      setSubmitting(true);
      setBookingError("");
      setBookingSuccess("");

      booking = await createBooking({
        clientId: selectedUserId,
        expertId: selectedExpertId,
        slotId: selectedSlotId
      });
    } catch (error) {
      setBookingError(error.message);
      return;
    } finally {
      setSubmitting(false);
    }

    setBookingSuccess(`Booking ${booking.id} is confirmed.`);
    setBookingId(booking.id);
    setSelectedSlotId("");

    const [usersResult, bookingsResult, slotsResult] =
      await Promise.allSettled([
        getUsers(),
        getUserBookings(selectedUserId),
        getAvailableSlots(selectedExpertId)
      ]);

    if (usersResult.status === "fulfilled") {
      setUsers(usersResult.value);
      setUsersError("");
    } else {
      setUsersError(
        `Booking confirmed, but users could not be refreshed: ${usersResult.reason.message}`
      );
    }

    if (bookingsResult.status === "fulfilled") {
      setBookings(bookingsResult.value);
      setBookingsError("");
    } else {
      setBookingsError(
        `Booking confirmed, but bookings could not be refreshed: ${bookingsResult.reason.message}`
      );
    }

    if (slotsResult.status === "fulfilled") {
      setSlots(slotsResult.value);
      setSlotsError("");
    } else {
      setSlotsError(
        `Booking confirmed, but slots could not be refreshed: ${slotsResult.reason.message}`
      );
    }
  }

  async function handleBookingLookup(event) {
    event.preventDefault();

    try {
      setLookupLoading(true);
      setLookupError("");
      setLookupResult(null);
      setLookupResult(await getBooking(bookingId.trim()));
    } catch (error) {
      setLookupError(error.message);
    } finally {
      setLookupLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header>
        <p className="eyebrow">Consultation booking</p>
        <h1>Book an expert consultation</h1>
        <p>Select a seeded user, reserve a slot, and review their bookings.</p>
      </header>

      <section className="panel">
        <label htmlFor="user">User</label>
        <select
          id="user"
          value={selectedUserId}
          disabled={usersLoading}
          onChange={(event) => {
            setSelectedUserId(event.target.value);
            setBookingError("");
            setBookingSuccess("");
          }}
        >
          <option value="">
            {usersLoading ? "Loading users..." : "Select a user"}
          </option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} — {user.credits} credits
            </option>
          ))}
        </select>

        {usersError && <p className="message error">{usersError}</p>}
        {!usersLoading && !usersError && users.length === 0 && (
          <p className="message">
            No users found. Run <code>npm run seed</code> first.
          </p>
        )}
        {selectedUser && (
          <p className="balance">
            Available balance: <strong>{selectedUser.credits} credits</strong>
          </p>
        )}
      </section>

      <div className="content-grid">
        <form className="panel" onSubmit={handleCreateBooking}>
          <h2>Create booking</h2>
          <p className="hint">
            Choose an expert and one of their available consultation times.
          </p>

          <label htmlFor="expert">Expert</label>
          <select
            id="expert"
            value={selectedExpertId}
            disabled={expertsLoading}
            onChange={(event) => {
              setSelectedExpertId(event.target.value);
              setBookingError("");
              setBookingSuccess("");
            }}
            required
          >
            <option value="">
              {expertsLoading ? "Loading experts..." : "Select an expert"}
            </option>
            {experts.map((expert) => (
              <option key={expert.id} value={expert.id}>
                {expert.name}
              </option>
            ))}
          </select>
          {expertsError && (
            <p className="message error">{expertsError}</p>
          )}

          <label htmlFor="slot">Available slot</label>
          <select
            id="slot"
            value={selectedSlotId}
            disabled={!selectedExpertId || slotsLoading}
            onChange={(event) => setSelectedSlotId(event.target.value)}
            required
          >
            <option value="">
              {slotsLoading ? "Loading slots..." : "Select a time"}
            </option>
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {formatDate(slot.startsAt)} – {formatTime(slot.endsAt)}
              </option>
            ))}
          </select>
          {slotsError && <p className="message error">{slotsError}</p>}
          {selectedExpertId &&
            !slotsLoading &&
            !slotsError &&
            slots.length === 0 && (
              <p className="message">No available slots for this expert.</p>
            )}

          <button
            type="submit"
            disabled={
              !selectedUserId ||
              !selectedExpertId ||
              !selectedSlotId ||
              submitting
            }
          >
            {submitting ? "Booking..." : "Book consultation"}
          </button>

          {bookingError && (
            <p className="message error">{bookingError}</p>
          )}
          {bookingSuccess && (
            <p className="message success">{bookingSuccess}</p>
          )}
        </form>

        <section className="panel">
          <h2>User bookings</h2>

          {!selectedUserId && <p>Select a user to view their bookings.</p>}
          {bookingsLoading && <p>Loading bookings...</p>}
          {bookingsError && (
            <p className="message error">{bookingsError}</p>
          )}
          {selectedUserId &&
            !bookingsLoading &&
            !bookingsError &&
            bookings.length === 0 && <p>This user has no bookings yet.</p>}

          <div className="booking-list">
            {bookings.map((booking) => (
              <article className="booking-card" key={booking.id}>
                <div>
                  <strong>{booking.status}</strong>
                  <span>{formatDate(booking.startsAt)}</span>
                </div>
                <dl>
                  <dt>Booking</dt>
                  <dd>{booking.id}</dd>
                  <dt>Expert</dt>
                  <dd>{booking.expertName}</dd>
                </dl>
              </article>
            ))}
          </div>
        </section>
      </div>

      <form className="panel lookup" onSubmit={handleBookingLookup}>
        <h2>Find booking by ID</h2>
        <div className="inline-form">
          <input
            aria-label="Booking ID"
            value={bookingId}
            onChange={(event) => setBookingId(event.target.value)}
            placeholder="Booking UUID"
            required
          />
          <button type="submit" disabled={lookupLoading}>
            {lookupLoading ? "Looking up..." : "Find booking"}
          </button>
        </div>

        {lookupError && <p className="message error">{lookupError}</p>}
        {lookupResult && (
          <article className="lookup-result">
            <strong>{lookupResult.status}</strong>
            <span>{lookupResult.id}</span>
            <span>
              Expert:{" "}
              {experts.find(
                (expert) => expert.id === lookupResult.expertId
              )?.name ?? lookupResult.expertId}
            </span>
            <span>Slot: {lookupResult.slotId}</span>
          </article>
        )}
      </form>
    </main>
  );
}

export default App;
