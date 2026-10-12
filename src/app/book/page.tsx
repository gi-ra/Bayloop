"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Service = {
  id: string;
  name: string;
  description: string | null;
  price_min: number | null;
  price_max: number | null;
  estimated_minutes: number;
};

type Step = "service" | "time" | "details" | "confirmed";

const OPEN_HOUR = 8;
const CLOSE_HOUR = 17;

export default function BookPage() {
  const supabase = createClient();

  const [step, setStep] = useState<Step>("service");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [workshopId, setWorkshopId] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const [date, setDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [checkingSlots, setCheckingSlots] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [rego, setRego] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function load() {
      const [{ data: workshop }, { data: serviceRows }] = await Promise.all([
        supabase.from("workshops").select("id").limit(1).single(),
        supabase
          .from("services")
          .select("id, name, description, price_min, price_max, estimated_minutes")
          .order("name"),
      ]);
      if (workshop) setWorkshopId(workshop.id);
      if (serviceRows) setServices(serviceRows);
    }
    load();
  }, [supabase]);

  const candidateTimes = useMemo(() => {
    if (!date || !selectedService) return [];
    const times: Date[] = [];
    for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
      const start = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00`);
      const end = new Date(start.getTime() + selectedService.estimated_minutes * 60000);
      if (end.getHours() <= CLOSE_HOUR && end.getMinutes() === 0 || end.getHours() < CLOSE_HOUR) {
        times.push(start);
      }
    }
    return times;
  }, [date, selectedService]);

  async function checkAvailability() {
    if (!workshopId || !selectedService || candidateTimes.length === 0) return;
    setCheckingSlots(true);
    setError(null);

    const results = await Promise.all(
      candidateTimes.map(async (start) => {
        const end = new Date(start.getTime() + selectedService.estimated_minutes * 60000);
        const { data } = await supabase.rpc("has_available_bay", {
          p_workshop_id: workshopId,
          p_drop_off_at: start.toISOString(),
          p_pickup_at: end.toISOString(),
        });
        return data ? start : null;
      }),
    );

    setAvailableSlots(results.filter((d): d is Date => d !== null));
    setCheckingSlots(false);
  }

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!workshopId || !selectedService || !selectedSlot) return;
    setError(null);
    setLoading(true);

    const pickupAt = new Date(
      selectedSlot.getTime() + selectedService.estimated_minutes * 60000,
    );

    const { error } = await supabase.rpc("create_public_booking", {
      p_workshop_id: workshopId,
      p_first_name: firstName,
      p_last_name: lastName,
      p_phone: phone,
      p_email: email,
      p_rego: rego,
      p_make: make,
      p_model: model,
      p_service_id: selectedService.id,
      p_drop_off_at: selectedSlot.toISOString(),
      p_pickup_at: pickupAt.toISOString(),
      p_notes: notes || null,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("confirmed");
  }

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Book a service</h1>

      {step === "service" && (
        <div className="flex flex-col gap-3">
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedService(s);
                setStep("time");
              }}
              className="rounded border px-4 py-3 text-left"
            >
              <div className="font-medium">{s.name}</div>
              {s.description && (
                <div className="text-sm text-gray-600">{s.description}</div>
              )}
              {(s.price_min || s.price_max) && (
                <div className="text-sm text-gray-500">
                  ${s.price_min}–${s.price_max}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {step === "time" && selectedService && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">{selectedService.name}</p>
          <label className="text-sm font-medium" htmlFor="date">
            Choose a date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => {
              setDate(e.target.value);
              setAvailableSlots([]);
              setSelectedSlot(null);
            }}
            className="rounded border px-3 py-2"
          />
          {date && (
            <button
              onClick={checkAvailability}
              disabled={checkingSlots}
              className="rounded border px-3 py-2 disabled:opacity-50"
            >
              {checkingSlots ? "Checking..." : "Check availability"}
            </button>
          )}

          {availableSlots.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot.toISOString()}
                  onClick={() => {
                    setSelectedSlot(slot);
                    setStep("details");
                  }}
                  className="rounded border px-2 py-2 text-sm"
                >
                  {slot.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </button>
              ))}
            </div>
          )}
          {date && !checkingSlots && availableSlots.length === 0 && candidateTimes.length > 0 && (
            <p className="text-sm text-gray-600">
              Click &quot;Check availability&quot; to see open times, or try another date if none
              show up.
            </p>
          )}

          <button onClick={() => setStep("service")} className="text-sm underline">
            Back
          </button>
        </div>
      )}

      {step === "details" && selectedSlot && (
        <form onSubmit={submitBooking} className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            {selectedService?.name} —{" "}
            {selectedSlot.toLocaleString([], {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="First name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="rounded border px-3 py-2"
            />
            <input
              placeholder="Last name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="rounded border px-3 py-2"
            />
          </div>
          <input
            placeholder="Mobile number"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded border px-3 py-2"
          />
          <input
            placeholder="Email (optional)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border px-3 py-2"
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              placeholder="Rego"
              required
              value={rego}
              onChange={(e) => setRego(e.target.value)}
              className="rounded border px-3 py-2"
            />
            <input
              placeholder="Make"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              className="rounded border px-3 py-2"
            />
            <input
              placeholder="Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="rounded border px-3 py-2"
            />
          </div>
          <textarea
            placeholder="Anything we should know? (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded border px-3 py-2"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
          >
            {loading ? "Booking..." : "Confirm booking"}
          </button>
          <button type="button" onClick={() => setStep("time")} className="text-sm underline">
            Back
          </button>
        </form>
      )}

      {step === "confirmed" && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Booking requested!</h2>
          <p className="text-gray-600">
            We&apos;ll text you at {phone} to confirm. See you{" "}
            {selectedSlot?.toLocaleString([], {
              weekday: "long",
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
            .
          </p>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </main>
  );
}
