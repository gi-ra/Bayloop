"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
    .select("id, customer_id, vehicle_id, bay_id, drop_off_at, notes")
    .eq("id", bookingId)
    .single();
  if (bookingError || !booking) throw new Error("Booking not found");

  const { error } = await supabase.from("jobs").insert({
    workshop_id: workshopId,
    booking_id: booking.id,
    customer_id: booking.customer_id,
    vehicle_id: booking.vehicle_id,
    bay_id: booking.bay_id,
    assigned_tech_id: technicianId,
    promised_at: booking.drop_off_at,
    customer_notes: booking.notes,
    status: "checked_in",
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

export async function updateJobStatus(formData: FormData) {
  const { supabase, userId } = await getOwnWorkshopId();
  const jobId = formData.get("job_id") as string;
  const newStatus = formData.get("status") as string;

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, status, assigned_tech_id, workshop_id")
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

  revalidatePath("/admin");
  revalidatePath("/tech");
}
