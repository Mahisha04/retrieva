import { serve } from "https://deno.land/x/sift@0.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const { email, otp } = await req.json();
  if (!email || !otp) return new Response(JSON.stringify({ error: "Email and OTP required" }), { status: 400 });

  const { data, error } = await supabase
    .from("email_otps")
    .select("*")
    .eq("email", email)
    .eq("otp", otp)
    .order("expires_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return new Response(JSON.stringify({ error: "Invalid OTP" }), { status: 400 });
  }

  const record = data[0];
  if (new Date(record.expires_at) < new Date()) {
    return new Response(JSON.stringify({ error: "OTP expired" }), { status: 400 });
  }

  // Optionally, delete OTP after verification
  await supabase.from("email_otps").delete().eq("id", record.id);

  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
});
