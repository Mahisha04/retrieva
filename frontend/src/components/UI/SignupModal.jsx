import React, { useCallback, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import PasswordStrengthMeter from "./PasswordStrengthMeter";
import { generatePasswordIdeas } from "../../utils/passwordIdeas";
import supabase from "../../supabaseClient";

const MIN_PASSWORD_SCORE = 2;

export default function SignupModal({ onClose, onSignup }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordScore, setPasswordScore] = useState(0);
  const [recommendedPasswords, setRecommendedPasswords] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState("");
  const [otpError, setOtpError] = useState("");

  const handleStrengthFeedback = useCallback(({ score = 0 } = {}) => {
    setPasswordScore(score);
  }, []);

  useEffect(() => {
    if (!password || passwordScore >= MIN_PASSWORD_SCORE) {
      setRecommendedPasswords([]);
      return;
    }
    setRecommendedPasswords(generatePasswordIdeas(password));
  }, [password, passwordScore]);

  // ----------------------------------
  // SEND OTP
  // ----------------------------------
  const handleSendOtp = async () => {
    setOtpLoading(true);
    setOtpError("");
    setOtpSuccess("");

    try {
      const res = await fetch(
        "https://fcihpclldwuckzfwohkf.supabase.co/functions/v1/send-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.toLowerCase() }),
        }
      );

      const data = await res.json();
      if (!data.success) {
        setOtpError(data.error || "Failed to send OTP");
      } else {
        setOtpSent(true);
        setOtpSuccess("OTP sent to your email!");
      }
    } catch (err) {
      setOtpError("Error sending OTP");
    }

    setOtpLoading(false);
  };

  // ----------------------------------
  // VERIFY OTP
  // ----------------------------------
  const handleVerifyOtp = async () => {
    setOtpError("");
    setOtpSuccess("");
    setOtpLoading(true);

    try {
      const response = await fetch(
        "https://fcihpclldwuckzfwohkf.supabase.co/functions/v1/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.toLowerCase(), otp }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        setOtpError(data.error || "Invalid OTP");
        setOtpLoading(false);
        return;
      }

      setOtpVerified(true);
      setOtpSuccess("OTP verified! You can now complete signup.");
    } catch (err) {
      setOtpError("Error verifying OTP");
    }

    setOtpLoading(false);
  };

  // ----------------------------------
  // SUBMIT SIGNUP
  // ----------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!otpVerified) {
      setError("Please verify OTP first.");
      return;
    }

    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Create Supabase user
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
      });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      const user = authData.user;

      // Insert profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        phone,
        email: email.toLowerCase(),
      });

      if (profileError) {
        setError("Failed to save profile.");
        return;
      }

      if (onSignup) onSignup({ id: user.id, email: user.email });
      onClose();
    } catch (err) {
      setError("Unexpected error during signup.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full p-3 border rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none text-black";

  const isPasswordWeak = passwordScore < MIN_PASSWORD_SCORE;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Sign Up</h2>

        {/* STEP 1 — Email + Send OTP */}
        {!otpSent && !otpVerified && (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={inputClass}
            />

            <button
              className="w-full bg-teal-600 text-white p-2 rounded"
              onClick={handleSendOtp}
              disabled={otpLoading || !email}
            >
              {otpLoading ? "Sending OTP..." : "Send OTP"}
            </button>

            {otpError && <div className="text-red-400 font-bold">{otpError}</div>}
            {otpSuccess && <div className="text-green-400 font-bold">{otpSuccess}</div>}
          </>
        )}

        {/* STEP 2 — Enter OTP */}
        {otpSent && !otpVerified && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className={inputClass}
            />

            <button
              className="w-full bg-teal-600 text-white p-2 rounded"
              onClick={handleVerifyOtp}
              disabled={otpLoading || !otp}
            >
              {otpLoading ? "Verifying..." : "Verify OTP"}
            </button>

            {otpError && <div className="text-red-400 font-bold">{otpError}</div>}
            {otpSuccess && <div className="text-green-400 font-bold">{otpSuccess}</div>}
          </>
        )}

        {/* STEP 3 — Full Signup Form */}
        {otpVerified && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              className={inputClass}
            />

            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              className={inputClass}
            />

            <input type="email" readOnly value={email} className={inputClass} />

            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
              className={inputClass}
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={inputClass}
            />

            <PasswordStrengthMeter password={password} onFeedback={handleStrengthFeedback} />

            {isPasswordWeak && recommendedPasswords.length > 0 && (
              <div className="p-2 bg-red-500/10 border border-red-500/40 rounded-md text-sm">
                <p className="font-semibold text-red-300">Weak Password</p>
                <p className="text-red-200">Try one of these formats:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {recommendedPasswords.map((idea) => (
                    <span key={idea} className="bg-white/10 px-2 py-1 rounded text-xs">
                      {idea}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className={inputClass}
            />

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <button
              type="submit"
              disabled={isPasswordWeak || isSubmitting}
              className="w-full bg-lime-400 text-indigo-900 font-bold py-2 rounded shadow"
            >
              {isSubmitting ? "Creating account..." : "Submit"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
