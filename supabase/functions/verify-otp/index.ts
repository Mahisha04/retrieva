import { serve } from "https://deno.land/x/sift@0.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method Not Allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }
  let email, otp;
  try {
    const body = await req.json();
    email = body.email;
    otp = body.otp;
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!email || !otp) {
    return new Response(
      JSON.stringify({ success: false, error: "Email and OTP required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const { data, error } = await supabase
    .from("email_otps")
    serve(async (req) => {
      try {
        if (req.method !== "POST") {
          return new Response(
            JSON.stringify({ success: false, error: "Method Not Allowed" }),
            { status: 405, headers: { "Content-Type": "application/json" } }
          );
        }
        let email, otp;
        try {
          const body = await req.json();
          email = body.email;
          otp = body.otp;
        } catch {
          return new Response(
            JSON.stringify({ success: false, error: "Invalid JSON body" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        if (!email || !otp) {
          return new Response(
            JSON.stringify({ success: false, error: "Email and OTP required" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        const { data, error } = await supabase
          .from("email_otps")
          .select("*")
          .eq("email", email)
          .eq("otp", otp)
          .order("expires_at", { ascending: false })
          .limit(1);
        if (error || !data || data.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: "Invalid OTP" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        const record = data[0];
        if (new Date(record.expires_at) < new Date()) {
          return new Response(
            JSON.stringify({ success: false, error: "OTP expired" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        await supabase.from("email_otps").delete().eq("id", record.id);
        return new Response(
          JSON.stringify({ success: true, data: { message: "OTP verified" } }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    });
