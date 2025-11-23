import React from 'react';

const socials = [
  {
    label: 'GitHub',
    href: 'https://github.com/teams/retrieva',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
        <path d="M12 .5C5.648.5.5 5.648.5 12c0 5.089 3.292 9.395 7.864 10.916.574.106.784-.25.784-.555 0-.274-.01-1.001-.015-1.964-3.2.696-3.877-1.543-3.877-1.543-.523-1.331-1.278-1.687-1.278-1.687-1.044-.714.079-.7.079-.7 1.154.081 1.762 1.186 1.762 1.186 1.026 1.758 2.691 1.251 3.347.957.104-.743.401-1.252.73-1.541-2.553-.29-5.236-1.277-5.236-5.684 0-1.255.448-2.282 1.182-3.086-.118-.29-.513-1.458.111-3.04 0 0 .965-.309 3.162 1.18a10.89 10.89 0 0 1 2.881-.387c.977.004 1.962.132 2.881.387 2.196-1.489 3.16-1.18 3.16-1.18.626 1.582.232 2.75.114 3.04.736.804 1.18 1.831 1.18 3.086 0 4.419-2.688 5.39-5.253 5.675.413.355.782 1.053.782 2.124 0 1.532-.014 2.767-.014 3.145 0 .308.206.667.79.554C20.21 21.39 23.5 17.083 23.5 12 23.5 5.648 18.352.5 12 .5Z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/retrieva',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.026-3.037-1.852-3.037-1.853 0-2.137 1.447-2.137 2.942v5.664h-3.553V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.368-1.85 3.602 0 4.268 2.37 4.268 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM7.118 20.452H3.554V9h3.564v11.452Z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/retrieva',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.347 3.608 1.322.975.975 1.26 2.242 1.322 3.608.058 1.266.07 1.646.07 4.839 0 3.205-.012 3.585-.07 4.851-.062 1.366-.347 2.633-1.322 3.608-.975.975-2.242 1.26-3.608 1.322-1.266.058-1.646.07-4.85.07-3.205 0-3.585-.012-4.851-.07-1.366-.062-2.633-.347-3.608-1.322-.975-.975-1.26-2.242-1.322-3.608-.058-1.266-.07-1.646-.07-4.851 0-3.193.012-3.573.07-4.839.062-1.366.347-2.633 1.322-3.608C4.516 2.58 5.783 2.295 7.149 2.233 8.415 2.175 8.795 2.163 12 2.163Zm0-2.163C8.741 0 8.332.014 7.052.072 5.771.13 4.617.39 3.6 1.407 2.583 2.424 2.323 3.578 2.265 4.859 2.207 6.139 2.193 6.548 2.193 9.807v4.385c0 3.259.014 3.668.072 4.948.058 1.281.318 2.435 1.335 3.452 1.017 1.017 2.171 1.277 3.452 1.335 1.281.058 1.69.072 4.948.072s3.668-.014 4.948-.072c1.281-.058 2.435-.318 3.452-1.335 1.017-1.017 1.277-2.171 1.335-3.452.058-1.28.072-1.689.072-4.948V9.807c0-3.259-.014-3.668-.072-4.948-.058-1.281-.318-2.435-1.335-3.452C20.817.39 19.663.13 18.382.072 17.102.014 16.693 0 12.001 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324Zm0 10.163a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998Zm6.406-11.845a1.44 1.44 0 1 0 0-2.88 1.44 1.44 0 0 0 0 2.88Z" />
      </svg>
    ),
  },
  {
    label: 'Email',
    href: 'mailto:hello@retrieva.com',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
        <path d="M2.25 5.25A2.25 2.25 0 0 1 4.5 3h15a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 19.5 21h-15A2.25 2.25 0 0 1 2.25 18.75V5.25Zm2.25-.75a.75.75 0 0 0-.75.75v.333l8.25 4.95 8.25-4.95V5.25a.75.75 0 0 0-.75-.75h-15Zm15.75 3.517-7.81 4.688a.75.75 0 0 1-.78 0L6 8.017v10.733c0 .414.336.75.75.75h10.5a.75.75 0 0 0 .75-.75V8.017Z" />
      </svg>
    ),
  },
];

export default function ContactSection() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16" id="contact">
      <div className="w-full px-6 py-12 flex flex-col lg:flex-row gap-10 items-start">
        <form className="w-full max-w-md bg-gray-50 rounded-2xl p-6 shadow-sm space-y-4 order-2 lg:order-1">
          <div>
            <label className="block text-sm font-medium text-gray-700">Your Name</label>
            <input type="text" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email address</label>
            <input type="email" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={4} placeholder="Say hello..." />
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition">Submit</button>
        </form>
        <div className="order-1 lg:order-2 flex-1">
          <h2 className="text-2xl font-bold text-gray-900 tracking-wide">CONTACT FORM</h2>
          <p className="mt-2 text-sm text-gray-600 max-w-md">
            If there is something you want to suggest or you simply want to say hello, feel free to reach out. We'll follow up quickly.
          </p>
        </div>
      </div>
      <div className="border-t border-gray-100 py-6 text-center text-sm text-gray-500">
        <p>
          Created with <span className="text-red-500">♥</span> using MERN by <span className="font-semibold">Team Retrieva</span> · All rights reserved.
        </p>
      </div>
    </footer>
  );
}
