import React, { useCallback, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import PasswordStrengthMeter from "./PasswordStrengthMeter";
import { generatePasswordIdeas } from "../../utils/passwordIdeas";
import supabase from "../../supabaseClient";

const MIN_PASSWORD_SCORE = 2; // require at least "Medium"

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
    const ideas = generatePasswordIdeas(password);
    setRecommendedPasswords(ideas);
  }, [password, passwordScore]);

  // Send OTP to email using Edge Function
  const handleSendOtp = async () => {
    setOtpLoading(true);
    setOtpError("");
    setOtpSuccess("");
    try {
      const response = await fetch(
        "https://fcihpclldwuckzfwohkf.supabase.co/functions/v1/send-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await response.json();
      if (!data.success) {
        setOtpError(data.error || "Failed to send OTP");
        setOtpLoading(false);
        return;
      }
      setOtpSent(true);
      setOtpSuccess("OTP sent to your email!");
    } catch (err) {
      setOtpError("Error sending OTP");
    }
    setOtpLoading(false);
  };

  const handleVerifyOtp = async () => {
    setOtpError("");
    setOtpSuccess("");
    setOtpLoading(true);
    // Replace Supabase Auth verifyOtp with Edge Function call
    try {
      setOtpLoading(true);
      setOtpError("");
      setOtpSuccess("");
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
        setOtpError(data.error || "Invalid OTP. Try again.");
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

  // Restore original handleSubmit implementation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!otpVerified) {
      setError("Please verify your email with OTP before signing up.");
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
    if (passwordScore < MIN_PASSWORD_SCORE) {
      setError("Weak password detected. Please choose a stronger password.");
      return;
    }
    try {
      setIsSubmitting(true);
      // USER SIGNUP (you can customize)
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        throw new Error(signUpError.message);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    }
    setIsSubmitting(false);
  };

  const inputClass =
    "w-full p-3 border rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none";

  const isPasswordWeak = passwordScore < MIN_PASSWORD_SCORE;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Sign Up</h2>
        <div className="mb-4">
          <p className="text-sm text-gray-400">
            We just need a few details to create your account.
          </p>
        </div>
        <div className="space-y-4">
          {/* Step 1: Email + Send OTP */}
          {!otpSent && !otpVerified && (
            <React.Fragment>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className={`${inputClass} text-black`}
              />
              <button
                type="button"
                className="w-full bg-teal-600 text-white p-2 rounded"
                onClick={handleSendOtp}
                disabled={otpLoading || !email}
              >
                {otpLoading ? "Sending OTP..." : "Send OTP"}
              </button>
              {otpError && (
                <div className="text-red-400 font-bold">{otpError}</div>
              )}
              {otpSuccess && (
                <div className="text-green-400 font-bold">{otpSuccess}</div>
              )}
            </React.Fragment>
          )}
          {/* Step 2: OTP input + Verify */}
          {otpSent && !otpVerified && (
            <React.Fragment>
              <input
                type="text"
                className="w-full p-2 border rounded mb-2 text-black"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={otpLoading}
              />
              <button
                type="button"
                className="w-full bg-teal-600 text-white p-2 rounded"
                onClick={handleVerifyOtp}
                disabled={otpLoading || !otp}
              >
                {otpLoading ? "Verifying..." : "Verify OTP"}
              </button>
              {otpError && (
                <div className="text-red-400 font-bold">{otpError}</div>
              )}
              {otpSuccess && (
                <div className="text-green-400 font-bold">{otpSuccess}</div>
              )}
            </React.Fragment>
          )}
          {/* Step 3: Show full signup form only after OTP verified */}
          {otpVerified && (
            <React.Fragment>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                  className={`${inputClass} text-black`}
                />
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                  className={`${inputClass} text-black`}
                />
                <input
                  type="email"
                  required
                  value={email}
                  readOnly
                  placeholder="Email"
                  className={`${inputClass} text-black`}
                />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone Number"
                  className={`${inputClass} text-black`}
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className={`${inputClass} text-black`}
                />
                <div className="sm:col-span-2 space-y-3">
                  <PasswordStrengthMeter
                    password={password}
                    onFeedback={handleStrengthFeedback}
                  />
                  {isPasswordWeak && recommendedPasswords.length > 0 && (
                    <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100">
                      <p className="font-semibold text-red-200">Weak password</p>
                      <p className="text-red-100/90">
                        Try one of these secure formats:
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {recommendedPasswords.map((idea) => (
                          <span
                            key={idea}
                            className="rounded-full border border-white/30 bg-white/10 px-3 py-1 font-mono text-xs text-white"
                          >
                            {idea}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  className={`${inputClass} text-black`}
                />
              </div>
              {/* Close grid div before error and buttons */}
              {/* Error and buttons go outside the grid div but inside the fragment */}
              {error && (
                <div className="rounded-md bg-red-100 text-red-800 px-4 py-2 text-sm">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={isPasswordWeak || isSubmitting}
                className={`w-full rounded-full bg-gradient-to-r from-lime-300 to-lime-500 text-indigo-900 font-semibold py-3 mt-2 shadow-lg transition ${
                  isPasswordWeak || isSubmitting
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:opacity-95"
                }`}
              >
                {isSubmitting ? "Creating account..." : "Submit"}
              </button>
              <p className="text-center text-sm text-gray-200 mt-4">
                Have an account?{" "}
                <span
                  className="text-cyan-300 underline cursor-pointer"
                  onClick={onClose}
                >
                  Click here
                </span>
              </p>
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
}
