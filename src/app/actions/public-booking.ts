"use server";

import { createClient } from "@/lib/supabase/server";
import { sendSms } from "@/lib/sms";
import { sendEmail } from "@/lib/email";

type CreateBookingInput = {
  workshopId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  rego: string;
  make: string;
  model: string;
  serviceId: string;
  dropOffAt: string;
  pickupAt: string;
  notes: string | null;
};

export async function createBooking(input: CreateBookingInput) {
  const supabase = await createClient();

  const { data: bookingId, error } = await supabase.rpc("create_public_booking", {
    p_workshop_id: input.workshopId,
    p_first_name: input.firstName,
    p_last_name: input.lastName,
    p_phone: input.phone,
    p_email: input.email,
    p_rego: input.rego,
    p_make: input.make,
    p_model: input.model,
    p_service_id: input.serviceId,
    p_drop_off_at: input.dropOffAt,
    p_pickup_at: input.pickupAt,
    p_notes: input.notes,
  });

  if (error || !bookingId) {
    return { error: error?.message ?? "Could not create booking" };
  }

  const when = new Date(input.dropOffAt).toLocaleString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  await sendSms(
    input.phone,
    `Boyta Auto Centre: booking confirmed for ${when}. We'll text you updates as your car moves through the workshop.`,
    { workshopId: input.workshopId },
  );
  if (input.email) {
    await sendEmail(
      input.email,
      "Booking confirmed — Boyta Auto Centre",
      `<p>Hi ${input.firstName},</p><p>Your booking is confirmed for <strong>${when}</strong>. We'll keep you posted by text as your car moves through the workshop.</p>`,
      { workshopId: input.workshopId },
    );
  }

  return { bookingId };
}
