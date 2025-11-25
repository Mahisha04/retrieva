import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import "./index.css";

import Header from "./components/UI/Header";
import HomePage from "./HomePage";
import AddItem from "./components/AddItem";
import { isFoundAdmin } from "./config";

const tabFromHash = () => {
  if (typeof window === 'undefined' || !window.location) return 'feed';
  const hash = (window.location.hash || '').toLowerCase();
  if (hash.includes('finder-responses') || hash.includes('responses')) {
    return 'responses';
  }
  return 'feed';
};

const deriveUserId = (payload) => {
  if (!payload) return '';
  const candidate = payload.id || payload.email || payload.phone || '';
  return candidate ? candidate.toString().trim().toLowerCase() : '';
};

const normalizeUserState = (payload) => {
  if (!payload) return null;
  const normalizedId = deriveUserId(payload);
  return {
    id: normalizedId || null,
    email: payload.email || '',
    name: payload.name || null,
    phone: payload.phone || null,
  };
};

export default function App() {
  const [showAdd, setShowAdd] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      const stored = raw ? JSON.parse(raw) : null;
      return normalizeUserState(stored);
    } catch (e) {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState(() => tabFromHash());
  const isAdmin = React.useMemo(() => isFoundAdmin(user), [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleHashChange = () => {
      setActiveTab(tabFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSetTab = useCallback((nextTab) => {
    setActiveTab(nextTab);
    if (typeof window === 'undefined') return;
    if (nextTab === 'responses') {
      if ((window.location.hash || '').toLowerCase() !== '#finder-responses') {
        window.location.hash = '#finder-responses';
      }
    } else if (window.location.hash) {
      const { pathname, search } = window.location;
      window.history.replaceState(null, '', `${pathname}${search}`);
    }
  }, []);

  const handleLogin = (u) => {
    // Basic mock login: store minimal user info in state/localStorage
    const usr = normalizeUserState(u);
    setUser(usr);
    try {
      localStorage.setItem("user", JSON.stringify(usr));
      // store email in savedEmails list for quick reuse
      try {
        const raw = localStorage.getItem('savedEmails') || '[]';
        const arr = JSON.parse(raw || '[]');
        const email = (u.email || '').toString().toLowerCase();
        if (email && !arr.includes(email)) {
          arr.unshift(email);
          // keep max 10
          const out = arr.slice(0,10);
          localStorage.setItem('savedEmails', JSON.stringify(out));
        }
      } catch (e) {}
    } catch (e) {
      // ignore
    }
  };

  const handleSignup = (u) => {
    const usr = normalizeUserState(u);
    setUser(usr);
    try {
      localStorage.setItem("user", JSON.stringify(usr));
      // save signed-up email for reuse
      try {
        const raw = localStorage.getItem('savedEmails') || '[]';
        const arr = JSON.parse(raw || '[]');
        const email = (u.email || '').toString().toLowerCase();
        if (email && !arr.includes(email)) {
          arr.unshift(email);
          const out = arr.slice(0,10);
          localStorage.setItem('savedEmails', JSON.stringify(out));
        }
      } catch (e) {}
    } catch (e) {}
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem("user");
    } catch (e) {}
  };

  const formRef = React.useRef(null);

  return (
    <div className="app-container">
      <Header
        activeTab={activeTab}
        onOpenAdd={() => setShowAdd(true)}
        onSetTab={handleSetTab}
        user={user}
        isAdmin={isAdmin}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onLogout={handleLogout}
      />

      <HomePage
        onOpenAdd={() => setShowAdd(true)}
        user={user}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={handleSetTab}
        isAdmin={isAdmin}
      />

      {showAdd && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="bg-white rounded-lg w-full max-w-md flex flex-col relative"
            style={{ maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Submit Item</h3>
                <button
                  className="text-gray-500"
                  onClick={() => setShowAdd(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-auto flex-1 pb-24">
              <AddItem onClose={() => setShowAdd(false)} formRef={formRef} showButtons={false} user={user} />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white flex justify-end gap-2 shadow-md">
              <button
                type="button"
                className="px-3 py-2 bg-gray-200 rounded"
                onClick={() => (setShowAdd(false))}
              >
                Cancel
              </button>

              <button
                type="button"
                className="px-3 py-2 bg-teal-600 text-white rounded"
                onClick={() => {
                  // submit the form programmatically
                  try {
                    if (formRef.current && typeof formRef.current.requestSubmit === 'function') {
                      formRef.current.requestSubmit();
                    } else if (formRef.current) {
                      formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    }
                  } catch (e) {
                    console.error('Form submit failed', e);
                  }
                }}
              >
                Upload Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
