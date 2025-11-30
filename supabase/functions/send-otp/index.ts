import { serve } from "https://deno.land/x/sift@0.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const { email } = await req.json();
  if (!email) return new Response(JSON.stringify({ error: "Email required" }), { status: 400 });

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  // Store OTP
  await supabase.from("email_otps").insert({ email, otp, expires_at: expiresAt });

  // Send OTP via Resend
  await resend.emails.send({
    from: "no-reply@yourdomain.com",
    to: email,
    subject: "Your OTP Code",
    html: `<p>Your OTP code is <b>${otp}</b>. It expires in 5 minutes.</p>`
  });

  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
});
