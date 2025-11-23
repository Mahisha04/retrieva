import React from "react";

function InspirationIllustration() {
  return (
    <svg
      viewBox="0 0 360 260"
      className="w-full h-auto"
      role="img"
      aria-label="Student working on laptop"
    >
      <defs>
        <linearGradient id="deskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#261c63" />
          <stop offset="100%" stopColor="#3a2e89" />
        </linearGradient>
      </defs>
      <rect width="360" height="260" fill="transparent" />
      <path d="M30 210h300" stroke="#d9d6f5" strokeWidth="3" strokeLinecap="round" />
      <rect x="70" y="190" width="220" height="12" rx="6" fill="url(#deskGradient)" />
      <rect x="120" y="120" width="150" height="70" rx="6" fill="#ffffff" stroke="#221b61" strokeWidth="3" />
      <rect x="130" y="130" width="130" height="8" rx="4" fill="#241b64" />
      <rect x="130" y="148" width="90" height="8" rx="4" fill="#f98f2b" />
      <rect x="130" y="166" width="70" height="8" rx="4" fill="#28a0d3" />
      <circle cx="90" cy="140" r="28" fill="#271c66" />
      <circle cx="90" cy="128" r="18" fill="#f7f4ff" />
      <rect x="80" y="150" width="20" height="50" rx="10" fill="#f7f4ff" />
      <rect x="78" y="192" width="24" height="26" rx="4" fill="#ee4d5f" />
      <rect x="108" y="200" width="45" height="10" rx="5" fill="#271c66" />
      <path d="M220 205h30" stroke="#271c66" strokeWidth="6" strokeLinecap="round" />
      <circle cx="250" cy="205" r="6" fill="#271c66" />
      <circle cx="60" cy="205" r="6" fill="#271c66" />
      <circle cx="300" cy="205" r="6" fill="#271c66" />
    </svg>
  );
}

export default function ProjectInspiration({ onGetStarted }) {
  return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-6 py-16 grid gap-12 md:grid-cols-2 items-center">
        <div className="max-w-md mx-auto">
          <InspirationIllustration />
        </div>
        <div className="text-center md:text-left">
          <p className="uppercase tracking-[0.3em] text-sm text-indigo-700 font-semibold">My Project Inspiration</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#271c66] mt-4">
            Colleges are full of little mysteries – like where that earphone disappeared.
          </h2>
          <p className="text-base md:text-lg text-gray-600 mt-4 leading-relaxed">
            I kept hearing friends panic about a missing gadget or ID the moment they sat down in class.
            Was it in the last lab, the hostel desk, or left in the library? Those stories felt so relatable
            that building a simple, friendly lost-and-found felt inevitable. If it helps one student get their
            essentials back, the effort is worth it.
          </p>
          <button
            type="button"
            onClick={onGetStarted}
            className="inline-flex items-center justify-center rounded-full bg-[#35218d] text-white font-semibold px-8 py-3 mt-8 shadow-md hover:bg-[#4a33c0] transition"
          >
            Get Started
          </button>
        </div>
      </div>
    </section>
  );
}
