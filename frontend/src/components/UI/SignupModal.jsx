import React, { useCallback, useEffect, useState } from "react";
import supabase from "../../supabaseClient";
import PasswordStrengthMeter from "./PasswordStrengthMeter";
import { generatePasswordIdeas } from "../../utils/passwordIdeas";

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

  // OTP states
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

  // SEND OTP USING EDGE FUNCTION
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

  // VERIFY OTP USING EDGE FUNCTION (FIXED)
  const handleVerifyOtp = async () => {
    setOtpLoading(true);
    setOtpError("");
    setOtpSuccess("");

    try {
      const res = await fetch(
        "https://fcihpclldwuckzfwohkf.supabase.co/functions/v1/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.toLowerCase(), otp }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        setOtpError(data.error || "Invalid OTP");
        setOtpLoading(false);
        return;
      }

      setOtpVerified(true);
      setOtpSuccess("OTP verified! You can now complete signup.");
    } catch (err) {
      setOtpError("Verification failed.");
    }

    setOtpLoading(false);
  };

  // SUBMIT SIGNUP FORM
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

      // 1. CREATE USER IN SUPABASE AUTH
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
      });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      const user = authData.user;

      // 2. CREATE PROFILE RECORD
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

      if (onSignup) {
        onSignup({ id: user.id, email: user.email });
      }

      onClose();
    } catch (err) {
      setError("Unexpected error during signup.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full p-3 border rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none text-black";

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50" onClick={onClose}>
      <div
        className="bg-gray-900 text-white rounded-lg shadow-lg p-6 max-w-md w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button (fixed) */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-white text-2xl font-bold hover:text-red-400"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-4">Sign Up</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1 - Email + Send OTP */}
          {!otpSent && !otpVerified && (
            <>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className={inputClass}
              />
              <button
                type="button"
                className="w-full bg-teal-600 text-white p-2 rounded"
                onClick={handleSendOtp}
                disabled={otpLoading || !email}
              >
                {otpLoading ? "Sending OTP..." : "Send OTP"}
              </button>
              {otpError && <p className="text-red-400">{otpError}</p>}
              {otpSuccess && <p className="text-green-400">{otpSuccess}</p>}
            </>
          )}

          {/* Step 2 - OTP input */}
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
                type="button"
                className="w-full bg-teal-600 text-white p-2 rounded"
                onClick={handleVerifyOtp}
                disabled={otpLoading || !otp}
              >
                {otpLoading ? "Verifying..." : "Verify OTP"}
              </button>
              {otpError && <p className="text-red-400">{otpError}</p>}
              {otpSuccess && <p className="text-green-400">{otpSuccess}</p>}
            </>
          )}

          {/* Step 3 - Full form after OTP verified */}
          {otpVerified && (
            <>
              <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" className={inputClass} />
              <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" className={inputClass} />
              <input type="email" required value={email} readOnly placeholder="Email" className={inputClass} />
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" className={inputClass} />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={inputClass} />
              <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className={inputClass} />

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button type="submit" className="w-full bg-lime-400 text-indigo-900 p-3 rounded font-bold">
                {isSubmitting ? "Creating account..." : "Submit"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
