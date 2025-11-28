import React, { useCallback, useEffect, useState } from "react";
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

  const handleStrengthFeedback = useCallback(({ score = 0 } = {}) => {
    setPasswordScore(score);
  }, []);

  useEffect(() => {
    if (!password || passwordScore >= MIN_PASSWORD_SCORE) {
      setRecommendedPasswords([]);
      return;
    }
    setRecommendedPasswords((prev) => (prev.length ? prev : generatePasswordIdeas()));
  }, [password, passwordScore]);

  const isPasswordWeak = Boolean(password) && passwordScore < MIN_PASSWORD_SCORE;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (passwordScore < MIN_PASSWORD_SCORE) {
      setError("Weak password detected. Please choose a stronger password before continuing.");
      return;
    }

    const name = `${firstName} ${lastName}`.trim();

    try {
      setIsSubmitting(true);

      const raw = localStorage.getItem("accounts");
      const accounts = raw ? JSON.parse(raw) : [];
      const exists = accounts.find(
        (a) => a.email && a.email.toLowerCase() === email.toLowerCase()
      );
      if (exists) {
        setError("An account with this email already exists. Please login.");
        return;
      }

      const { error: supabaseError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            firstName,
            lastName,
            phone
          }
        }
      });

      if (supabaseError) {
        console.error("Supabase signup failed", supabaseError);
        setError(supabaseError.message || "Unable to create account right now. Please try again.");
        return;
      }

      const acct = { name, firstName, lastName, email, phone, password };
      accounts.push(acct);
      localStorage.setItem("accounts", JSON.stringify(accounts));

      if (onSignup) onSignup({ name, email, phone });
      onClose();
    } catch (err) {
      console.error("Signup failed:", err);
      setError("Signup failed. See console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "rounded-full border-2 border-cyan-300 bg-transparent px-4 py-3 placeholder-cyan-200 text-white focus:outline-none focus:ring-2 focus:ring-cyan-200";

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-[#1a1550] text-white shadow-2xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold tracking-wide">SIGN UP</h3>
          <button
            className="text-gray-300 hover:text-white text-xl"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              className={inputClass}
            />
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              className={inputClass}
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={inputClass}
            />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
              className={inputClass}
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={inputClass}
            />
            <div className="sm:col-span-2 space-y-3">
              <PasswordStrengthMeter password={password} onFeedback={handleStrengthFeedback} />
              {isPasswordWeak && recommendedPasswords.length > 0 && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100">
                  <p className="font-semibold text-red-200">Weak password</p>
                  <p className="text-red-100/90">Try one of these secure formats:</p>
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
              className={inputClass}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-100 text-red-800 px-4 py-2 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPasswordWeak || isSubmitting}
            className={`w-full rounded-full bg-gradient-to-r from-lime-300 to-lime-500 text-indigo-900 font-semibold py-3 mt-2 shadow-lg transition ${
              isPasswordWeak || isSubmitting ? "opacity-60 cursor-not-allowed" : "hover:opacity-95"
            }`}
          >
            {isSubmitting ? "Creating account..." : "Submit"}
          </button>

          <p className="text-center text-sm text-gray-200 mt-4">
            Have an account? <span className="text-cyan-300 underline cursor-pointer" onClick={onClose}>Click here</span>
          </p>
        </form>
      </div>
    </div>
  );
}
