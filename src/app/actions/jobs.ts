"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendSms } from "@/lib/sms";
import { sendEmail } from "@/lib/email";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const STATUS_MESSAGES: Record<string, string> = {
  checked_in: "We've got your car and will keep you posted as work begins.",
  on_lift: "Your car is on the hoist now — we'll send findings shortly.",
  waiting_on_parts: "We're waiting on a part to continue your job.",
  road_test: "Repairs are done — we're giving it a road test now.",
  ready: "Your car is ready for pickup!",
};

async function getOwnWorkshopId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("workshop_id")
    .eq("id", user.id)
    .single();
  if (!profile?.workshop_id) throw new Error("No workshop on this account");

  return { supabase, workshopId: profile.workshop_id as string, userId: user.id };
}

// Statuses where the time clock should be running.
const CLOCKED_STATUSES = ["on_lift", "road_test"];

export async function checkInBooking(formData: FormData) {
  const { supabase, workshopId } = await getOwnWorkshopId();
  const bookingId = formData.get("booking_id") as string;
  const technicianId = formData.get("technician_id") as string;

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, customer_id, vehicle_id, bay_id, drop_off_at, notes, customers(phone, email)")
    .eq("id", bookingId)
    .single();
  if (bookingError || !booking) throw new Error("Booking not found");

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      workshop_id: workshopId,
      booking_id: booking.id,
      customer_id: booking.customer_id,
      vehicle_id: booking.vehicle_id,
      bay_id: booking.bay_id,
      assigned_tech_id: technicianId,
      promised_at: booking.drop_off_at,
      customer_notes: booking.notes,
      status: "checked_in",
    })
    .select("tracker_token")
    .single();
  if (error || !job) throw new Error(error?.message ?? "Could not create job");

  const customer = booking.customers as unknown as { phone: string | null; email: string | null } | null;
  const trackerUrl = `${SITE_URL}/track/${job.tracker_token}`;
  if (customer?.phone) {
    await sendSms(
      customer.phone,
      `${STATUS_MESSAGES.checked_in} Track your car: ${trackerUrl}`,
      { workshopId, customerId: booking.customer_id },
    );
  }
  if (customer?.email) {
    await sendEmail(
      customer.email,
      "We've got your car — Boyta Auto Centre",
      `<p>${STATUS_MESSAGES.checked_in}</p><p><a href="${trackerUrl}">Track your car</a></p>`,
      { workshopId, customerId: booking.customer_id },
    );
  }

  revalidatePath("/admin");
}

export async function updateJobStatus(formData: FormData) {
  const { supabase, userId } = await getOwnWorkshopId();
  const jobId = formData.get("job_id") as string;
  const newStatus = formData.get("status") as string;

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select(
      "id, status, assigned_tech_id, workshop_id, customer_id, tracker_token, customers(phone, email)",
    )
    .eq("id", jobId)
    .single();
  if (jobError || !job) throw new Error("Job not found (or you don't have access to it)");

  const wasClocked = CLOCKED_STATUSES.includes(job.status);
  const willBeClocked = CLOCKED_STATUSES.includes(newStatus);

  if (wasClocked && !willBeClocked) {
    await supabase
      .from("time_entries")
      .update({ stopped_at: new Date().toISOString() })
      .eq("job_id", jobId)
      .is("stopped_at", null);
  }
  if (!wasClocked && willBeClocked) {
    await supabase.from("time_entries").insert({
      workshop_id: job.workshop_id,
      job_id: jobId,
      tech_id: job.assigned_tech_id ?? userId,
    });
  }

  const { error } = await supabase
    .from("jobs")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", jobId);
  if (error) throw new Error(error.message);

  const jobCustomer = job.customers as unknown as { phone: string | null; email: string | null } | null;
  const message = STATUS_MESSAGES[newStatus];
  const trackerUrl = `${SITE_URL}/track/${job.tracker_token}`;
  if (message && jobCustomer?.phone) {
    await sendSms(jobCustomer.phone, `${message} Track your car: ${trackerUrl}`, {
      workshopId: job.workshop_id,
      customerId: job.customer_id,
    });
  }
  if (message && jobCustomer?.email) {
    await sendEmail(
      jobCustomer.email,
      "Update on your car — Boyta Auto Centre",
      `<p>${message}</p><p><a href="${trackerUrl}">Track your car</a></p>`,
      { workshopId: job.workshop_id, customerId: job.customer_id },
    );
  }

  revalidatePath("/admin");
  revalidatePath("/tech");
}
