import React, { useState } from "react";
import LoginModal from "./LoginModal";
import SignupModal from "./SignupModal";
import ForgotPasswordModal from "./ForgotPasswordModal";

export default function Header({ onOpenAdd, onSetTab, activeTab, user, onLogin, onSignup, onLogout, isAdmin = false }) {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotPrefill, setForgotPrefill] = useState("");
  const displayName = user ? (user.name ? user.name.split(' ')[0] : (user.email ? user.email.split('@')[0] : null)) : null;

  return (
    <>
      <button
        className={`px-3 py-2 rounded ${activeTab === 'found-board' ? 'bg-teal-600 text-white' : 'bg-white border text-gray-700 hover:bg-teal-600 hover:text-white'} transition`}
        onClick={() => onSetTab && onSetTab('found-board')}
      >
        Found Items
      </button>

      <button
        className={`px-3 py-2 rounded ${activeTab === 'report-found' ? 'bg-teal-600 text-white' : 'bg-white border text-gray-700 hover:bg-teal-600 hover:text-white'} transition`}
        onClick={() => onSetTab && onSetTab('report-found')}
      >
        Report Found
      </button>

      <button
        className={`px-3 py-2 rounded ${activeTab === 'found-unclaimed' ? 'bg-teal-600 text-white' : 'bg-white border text-gray-700 hover:bg-teal-600 hover:text-white'} transition`}
        onClick={() => onSetTab && onSetTab('found-unclaimed')}
      >
        Unclaimed Found
      </button>

      <button
        className={`px-3 py-2 rounded ${activeTab === 'found-my-items' ? 'bg-teal-600 text-white' : 'bg-white border text-gray-700 hover:bg-teal-600 hover:text-white'} transition`}
        onClick={() => onSetTab && onSetTab('found-my-items')}
      >
        My Found Items
      </button>

      <button
        className={`px-3 py-2 rounded ${activeTab === 'found-my-claims' ? 'bg-teal-600 text-white' : 'bg-white border text-gray-700 hover:bg-teal-600 hover:text-white'} transition`}
        onClick={() => onSetTab && onSetTab('found-my-claims')}
      >
        My Found Claims
      </button>

      {isAdmin && (
        <button
          className={`px-3 py-2 rounded ${activeTab === 'found-approvals' ? 'bg-teal-600 text-white' : 'bg-white border text-gray-700 hover:bg-teal-600 hover:text-white'} transition`}
          onClick={() => onSetTab && onSetTab('found-approvals')}
        >
          Found Approvals
        </button>
      )}
    </>
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
                className={`px-3 py-2 rounded ${activeTab === 'lost-board' ? 'bg-teal-600 text-white' : 'bg-white border text-gray-700 hover:bg-teal-600 hover:text-white'} transition`}
                onClick={() => onSetTab && onSetTab('lost-board')}
              >
                Lost Items
              </button>

              <button
                className={`px-3 py-2 rounded ${activeTab === 'found-board' ? 'bg-teal-600 text-white' : 'bg-white border text-gray-700 hover:bg-teal-600 hover:text-white'} transition`}
                onClick={() => onSetTab && onSetTab('found-board')}
              >
                Found Items
              </button>

              <button
                className={`px-3 py-2 rounded ${activeTab === 'returned-items' ? 'bg-teal-600 text-white' : 'bg-white border text-gray-700 hover:bg-teal-600 hover:text-white'} transition`}
                onClick={() => onSetTab && onSetTab('returned-items')}
              >
                Returned Items
              </button>

              <button
                className={`px-3 py-2 rounded ${activeTab === 'report-found' ? 'bg-teal-600 text-white' : 'bg-white border text-gray-700 hover:bg-teal-600 hover:text-white'} transition`}
                onClick={() => onSetTab && onSetTab('report-found')}
              >
                Report Found
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
          onForgotPassword={(prefillEmail) => {
            setForgotPrefill(prefillEmail || "");
            setShowLogin(false);
            setShowForgot(true);
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

      {showForgot && (
        <ForgotPasswordModal
          initialEmail={forgotPrefill}
          onClose={() => {
            setShowForgot(false);
          }}
          onResetComplete={(info) => {
            setShowForgot(false);
            if (info?.email) {
              setForgotPrefill(info.email);
            }
            setShowLogin(true);
          }}
        />
      )}
    </div>
  );
}
