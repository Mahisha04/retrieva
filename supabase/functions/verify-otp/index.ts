import { serve } from "https://deno.land/x/sift@0.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("PROJECT_URL")!,
  Deno.env.get("SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ valid: false, error: "Method Not Allowed" }),
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
        JSON.stringify({ valid: false, error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ valid: false, error: "Email and OTP required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get OTP record
    const { data, error } = await supabase
      .from("email_otps")
      .select("*")
      .eq("email", email)
      .eq("otp", otp)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid OTP" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const now = Date.now();
    const expires = new Date(data.expires_at).getTime();

    if (now > expires) {
      return new Response(
        JSON.stringify({ valid: false, error: "OTP expired" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // OTP is valid
    return new Response(
      JSON.stringify({ valid: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({
        valid: false,
        error: err instanceof Error ? err.message : String(err)
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
