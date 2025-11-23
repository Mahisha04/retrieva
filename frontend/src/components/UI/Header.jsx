import React, { useState } from "react";
import LoginModal from "./LoginModal";
import SignupModal from "./SignupModal";

export default function Header({ onOpenAdd, onSetTab, activeTab, user, onLogin, onSignup, onLogout }) {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const displayName = user ? (user.name ? user.name.split(' ')[0] : (user.email ? user.email.split('@')[0] : null)) : null;

  return (
    <div className="flex justify-between items-center px-10 py-5 bg-white shadow-sm">
      <div className="flex flex-col">
        <h1 className="text-2xl font-extrabold tracking-wide text-[#0b1a4a]">Retrieva</h1>
        <p className="text-base text-gray-600">Cloud Lost &amp; Found System</p>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <div className="flex items-center gap-3">
              <button
                className={`px-3 py-2 rounded ${activeTab === 'feed' ? 'bg-teal-600 text-white' : 'bg-white border text-gray-700 hover:bg-teal-600 hover:text-white'} transition`}
                onClick={() => onSetTab && onSetTab('feed')}
              >
                Feed
              </button>

              <button
                className={`px-3 py-2 rounded ${activeTab === 'listings' ? 'bg-teal-600 text-white' : 'bg-white border text-gray-700 hover:bg-teal-600 hover:text-white'} transition`}
                onClick={() => onSetTab && onSetTab('listings')}
              >
                My Listings
              </button>

              <button
                className={`px-3 py-2 rounded ${activeTab === 'responses' ? 'bg-teal-600 text-white' : 'bg-white border text-gray-700 hover:bg-teal-600 hover:text-white'} transition`}
                onClick={() => onSetTab && onSetTab('responses')}
              >
                Responses
              </button>

              <button
                className={`px-3 py-2 rounded ${activeTab === 'add' ? 'bg-teal-600 text-white' : 'bg-white border text-gray-700 hover:bg-teal-600 hover:text-white'} transition`}
                onClick={() => { if (onSetTab) onSetTab('add'); if (onOpenAdd) onOpenAdd(); }}
              >
                Add Item
              </button>

              <button
                className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg"
                type="button"
                onClick={onLogout}
              >
                Sign Out
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              className="px-4 py-2 bg-transparent border border-teal-600 text-teal-600 rounded-lg"
              type="button"
              data-auth-trigger="login"
              onClick={() => setShowLogin(true)}
            >
              Login
            </button>

            <button
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg"
              type="button"
              onClick={() => setShowSignup(true)}
            >
              Sign Up
            </button>
          </>
        )}
      </div>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLogin={(u) => {
            if (onLogin) onLogin(u);
            setShowLogin(false);
          }}
        />
      )}

      {showSignup && (
        <SignupModal
          onClose={() => setShowSignup(false)}
          onSignup={(u) => {
            if (onSignup) onSignup(u);
            setShowSignup(false);
          }}
        />
      )}
    </div>
  );
}
