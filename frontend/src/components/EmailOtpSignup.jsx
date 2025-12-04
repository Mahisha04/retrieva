import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

export default function EmailOtpSignup() {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const sendOtp = async () => {
    setLoading(true); setError(""); setSuccess("");
    try {
      const cleanedEmail = email.trim().toLowerCase();
      const res = await fetch(
        "https://fcihpclldwuckzfwohkf.supabase.co/functions/v1/send-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanedEmail }),
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to send OTP");
      setStep("otp");
      setSuccess("OTP sent! Check your inbox.");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const cleanedEmail = email.trim().toLowerCase();
      const res = await fetch(
        "https://fcihpclldwuckzfwohkf.supabase.co/functions/v1/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanedEmail, otp }),
        }
      );

      const data = await res.json();

      if (!data.success) throw new Error(data.error || "Invalid OTP");

      setStep("signup");
      setSuccess("OTP verified! You can now sign up.");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true); setError(""); setSuccess("");
    try {
      const { error: signupError } = await supabase.auth.signUp({ email, password });
      if (signupError) throw new Error(signupError.message);
      setSuccess("Signup successful! Check your email for confirmation.");
      setStep("done");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      {step === "email" && (
        <>
          <h2 className="text-xl font-bold mb-2">Sign Up</h2>
          <input
            type="email"
            className="w-full p-2 border rounded mb-2"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
          />
          <button className="w-full bg-teal-600 text-white p-2 rounded" onClick={sendOtp} disabled={loading || !email}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </>
      )}
      {step === "otp" && (
        <>
          <h2 className="text-xl font-bold mb-2">Enter OTP</h2>
          <input
            type="text"
            className="w-full p-2 border rounded mb-2"
            placeholder="Enter OTP"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            disabled={loading}
          />
          <button className="w-full bg-teal-600 text-white p-2 rounded" onClick={verifyOtp} disabled={loading || !otp}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </>
      )}
      {step === "signup" && (
        <>
          <h2 className="text-xl font-bold mb-2">Set Password</h2>
          <input
            type="password"
            className="w-full p-2 border rounded mb-2"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
          />
          <button className="w-full bg-teal-600 text-white p-2 rounded" onClick={handleSignup} disabled={loading || !password}>
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </>
      )}
      {step === "done" && (
        <div className="text-green-600 font-bold">Signup complete! Please check your email.</div>
      )}
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {success && <div className="text-green-600 mt-2">{success}</div>}
    </div>
  );
}
