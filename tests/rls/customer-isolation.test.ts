import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

// Proves the single most important security guarantee in the whole app:
// a logged-in customer can only ever see their own vehicle, never another
// customer's — even though both rows live in the same `vehicles` table.
//
// This uses the service-role (admin) client to set up two fake customers
// behind the scenes, bypassing security rules on purpose just for setup.
// The actual test then signs in as each customer normally, through the
// public anon key, exactly like the real app does.

const stamp = Date.now();
const userA = { email: `rls-test-a-${stamp}@example.com`, password: "Test-Password-A1!" };
const userB = { email: `rls-test-b-${stamp}@example.com`, password: "Test-Password-B1!" };

const admin = createAdminClient();

let workshopId: string;
let userAId: string;
let userBId: string;
let customerAId: string;
let customerBId: string;
let vehicleAId: string;
let vehicleBId: string;

function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

beforeAll(async () => {
  const { data: workshop, error: workshopError } = await admin
    .from("workshops")
    .select("id")
    .limit(1)
    .single();
  if (workshopError || !workshop) {
    throw new Error(`Could not find a seeded workshop: ${workshopError?.message}`);
  }
  workshopId = workshop.id;

  const { data: createdA, error: errorA } = await admin.auth.admin.createUser({
    email: userA.email,
    password: userA.password,
    email_confirm: true,
    app_metadata: { role: "customer", workshop_id: workshopId },
  });
  if (errorA || !createdA.user) throw new Error(`Could not create test user A: ${errorA?.message}`);
  userAId = createdA.user.id;

  const { data: createdB, error: errorB } = await admin.auth.admin.createUser({
    email: userB.email,
    password: userB.password,
    email_confirm: true,
    app_metadata: { role: "customer", workshop_id: workshopId },
  });
  if (errorB || !createdB.user) throw new Error(`Could not create test user B: ${errorB?.message}`);
  userBId = createdB.user.id;

  const { data: customerA, error: customerAError } = await admin
    .from("customers")
    .insert({ workshop_id: workshopId, profile_id: userAId, first_name: "RLS Test A" })
    .select("id")
    .single();
  if (customerAError || !customerA) throw new Error(`Could not create customer A: ${customerAError?.message}`);
  customerAId = customerA.id;

  const { data: customerB, error: customerBError } = await admin
    .from("customers")
    .insert({ workshop_id: workshopId, profile_id: userBId, first_name: "RLS Test B" })
    .select("id")
    .single();
  if (customerBError || !customerB) throw new Error(`Could not create customer B: ${customerBError?.message}`);
  customerBId = customerB.id;

  const { data: vehicleA, error: vehicleAError } = await admin
    .from("vehicles")
    .insert({ workshop_id: workshopId, customer_id: customerAId, rego: "RLS-TEST-A" })
    .select("id")
    .single();
  if (vehicleAError || !vehicleA) throw new Error(`Could not create vehicle A: ${vehicleAError?.message}`);
  vehicleAId = vehicleA.id;

  const { data: vehicleB, error: vehicleBError } = await admin
    .from("vehicles")
    .insert({ workshop_id: workshopId, customer_id: customerBId, rego: "RLS-TEST-B" })
    .select("id")
    .single();
  if (vehicleBError || !vehicleB) throw new Error(`Could not create vehicle B: ${vehicleBError?.message}`);
  vehicleBId = vehicleB.id;
});

afterAll(async () => {
  // Clean up everything created for this test, real-database-safe.
  if (vehicleAId) await admin.from("vehicles").delete().eq("id", vehicleAId);
  if (vehicleBId) await admin.from("vehicles").delete().eq("id", vehicleBId);
  if (customerAId) await admin.from("customers").delete().eq("id", customerAId);
  if (customerBId) await admin.from("customers").delete().eq("id", customerBId);
  if (userAId) await admin.auth.admin.deleteUser(userAId);
  if (userBId) await admin.auth.admin.deleteUser(userBId);
});

describe("customer data isolation (row-level security)", () => {
  it("lets customer A see only their own vehicle", async () => {
    const clientA = createAnonClient();
    const { error: signInError } = await clientA.auth.signInWithPassword(userA);
    expect(signInError).toBeNull();

    const { data: vehicles, error } = await clientA.from("vehicles").select("id, rego");
    expect(error).toBeNull();
    expect(vehicles).toHaveLength(1);
    expect(vehicles?.[0].rego).toBe("RLS-TEST-A");
  });

  it("lets customer B see only their own vehicle", async () => {
    const clientB = createAnonClient();
    const { error: signInError } = await clientB.auth.signInWithPassword(userB);
    expect(signInError).toBeNull();

    const { data: vehicles, error } = await clientB.from("vehicles").select("id, rego");
    expect(error).toBeNull();
    expect(vehicles).toHaveLength(1);
    expect(vehicles?.[0].rego).toBe("RLS-TEST-B");
  });

  it("never returns customer A's vehicle to customer B, even when asked for it directly by id", async () => {
    const clientB = createAnonClient();
    await clientB.auth.signInWithPassword(userB);

    const { data, error } = await clientB.from("vehicles").select("id").eq("id", vehicleAId);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });
});
