import React, { useEffect, useMemo, useState } from "react";
import PasswordStrengthMeter from "./PasswordStrengthMeter";

export default function ForgotPasswordModal({ initialEmail = "", onClose, onResetComplete }) {
  const [email, setEmail] = useState(initialEmail);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [savedEmails, setSavedEmails] = useState([]);
  const [lastResetEmail, setLastResetEmail] = useState(null);

  useEffect(() => {
    setEmail(initialEmail || "");
  }, [initialEmail]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("savedEmails") || "[]";
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        const cleaned = data
          .map((value) => (value || "").toString().trim())
          .filter(Boolean);
        setSavedEmails(cleaned);
      } else {
        setSavedEmails([]);
      }
    } catch (e) {
      setSavedEmails([]);
    }
  }, []);

  const inputClass = useMemo(
    () =>
      "w-full rounded-full border-2 border-cyan-300 bg-transparent px-4 py-3 placeholder-cyan-200 text-white focus:outline-none focus:ring-2 focus:ring-cyan-200",
    []
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    setStatus(null);
    setLastResetEmail(null);

    const trimmedEmail = (email || "").trim();
    if (!trimmedEmail) {
      setStatus({ ok: false, message: "Please enter the email associated with your account." });
      return;
    }
    if (newPassword.length < 6) {
      setStatus({ ok: false, message: "New password must be at least 6 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ ok: false, message: "Passwords do not match." });
      return;
    }

    try {
      const raw = localStorage.getItem("accounts");
      const accounts = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(accounts) || accounts.length === 0) {
        setStatus({ ok: false, message: "No accounts found. Please sign up instead." });
        return;
      }

      const idx = accounts.findIndex(
        (acct) => acct.email && acct.email.toLowerCase() === trimmedEmail.toLowerCase()
      );
      if (idx === -1) {
        setStatus({ ok: false, message: "We couldn't find an account with that email." });
        return;
      }

      accounts[idx].password = newPassword;
      localStorage.setItem("accounts", JSON.stringify(accounts));
      setStatus({ ok: true, message: "Password updated. You can log in with your new password." });
      setLastResetEmail(accounts[idx].email);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Failed to reset password", error);
      setStatus({ ok: false, message: "Something went wrong. Please try again." });
    }
  };

  const handleReturnToLogin = () => {
    if (typeof onResetComplete === "function") {
      onResetComplete({ email: lastResetEmail || email });
    }
    if (typeof onClose === "function") {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-[#1a1550] text-white shadow-2xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-xs uppercase text-cyan-200 tracking-[0.4em]">ACCOUNT</p>
            <h3 className="text-2xl font-bold tracking-wide">RESET PASSWORD</h3>
          </div>
          <button className="text-gray-300 hover:text-white text-xl" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              list="forgot-saved-emails"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={inputClass}
            />
            <datalist id="forgot-saved-emails">
              {savedEmails.map((addr) => (
                <option key={addr} value={addr} />
              ))}
            </datalist>
          </div>

          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
            className={inputClass}
          />
          <PasswordStrengthMeter password={newPassword} />

          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm New Password"
            className={inputClass}
          />

          {status && (
            <div className={`rounded-md px-4 py-2 text-sm ${status.ok ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"}`}>
              {status.message}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-full bg-gradient-to-r from-lime-300 to-lime-500 text-indigo-900 font-semibold py-3 shadow-lg hover:opacity-95 transition"
          >
            Reset Password
          </button>
        </form>

        {status?.ok && (
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-cyan-200 underline hover:text-white"
              onClick={handleReturnToLogin}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
