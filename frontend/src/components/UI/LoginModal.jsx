import React, { useState, useEffect } from "react";

export default function LoginModal({ onClose, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [savedEmails, setSavedEmails] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate against stored accounts in localStorage
    try {
      const raw = localStorage.getItem('accounts');
      const accounts = raw ? JSON.parse(raw) : [];
      const match = accounts.find(a => a.email && a.email.toLowerCase() === email.toLowerCase() && a.password === password);
      if (!match) {
        setError('Invalid email or password. If you do not have an account, please sign up first.');
        return;
      }
      // Successful login
      if (onLogin) onLogin({ email: match.email, name: match.name, phone: match.phone || null });
      onClose();
    } catch (err) {
      console.error('Login failed:', err);
      setError('Login failed. See console for details.');
    }
  };

  const [error, setError] = React.useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('savedEmails') || '[]';
      const arr = JSON.parse(raw || '[]');
      if (!Array.isArray(arr)) {
        setSavedEmails([]);
        return;
      }
      const blocked = new Set(['mahisha123@gmail.com', 'aaditi2226@gmail.com']);
      const filtered = arr
        .map((value) => (value || '').toString().trim())
        .filter((value) => {
          if (!value) return false;
          const lower = value.toLowerCase();
          if (blocked.has(lower)) return false;
          if (/^\d+$/.test(value)) return false;
          return true;
        });
      setSavedEmails(filtered);
    } catch (e) {
      setSavedEmails([]);
    }
  }, []);

  const inputClass = "w-full rounded-full border-2 border-cyan-300 bg-transparent px-4 py-3 placeholder-cyan-200 text-white focus:outline-none focus:ring-2 focus:ring-cyan-200";

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
          <h3 className="text-2xl font-bold tracking-wide">LOGIN</h3>
          <button
            className="text-gray-300 hover:text-white text-xl"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              list="login-saved-emails"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={inputClass}
            />
            <datalist id="login-saved-emails">
              {savedEmails.map((addr) => (
                <option key={addr} value={addr} />
              ))}
            </datalist>
          </div>

          <div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
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
            className="w-full rounded-full bg-gradient-to-r from-lime-300 to-lime-500 text-indigo-900 font-semibold py-3 shadow-lg hover:opacity-95 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
