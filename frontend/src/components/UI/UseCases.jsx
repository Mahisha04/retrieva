import React from "react";

const useCases = (
  user,
  handlers
) => [
  {
    title: "1. Report a Lost Item",
    subtitle: "Upload a description and picture so finders can reach you.",
    steps: [
      "Sign in and open the Add Item form.",
      "Share what went missing, where, and how you prefer to be contacted.",
      "Submit so the listing appears instantly in Feed and My Listings."
    ],
    action: user ? "Open Add Item" : "Login to report",
    onClick: handlers.onReportLost
  },
  {
    title: "2. Finder Contacts the Owner",
    subtitle: "Browse the Lost Items board, open a card, and tap Claim Item.",
    steps: [
      "Open the Lost Items board to review posts and contact snippets.",
      "Answer the owner's question so they know you really have it.",
      "Your request goes straight to the Owner Approvals list."
    ],
    action: "Open Lost Items",
    onClick: handlers.onBrowseLost
  },
  {
    title: "3. Owner Claims it Back",
    subtitle: "Owners use Owner Approvals to respond to finder answers.",
    steps: [
      "Check Responses → Owner Approvals for pending matches.",
      "Compare the finder’s answer and approve to share your contact.",
      "You can then coordinate handoff directly with the finder."
    ],
    action: "Open Responses",
    onClick: handlers.onClaimFromFinder
  }
];

export default function UseCases({ user, onReportLost, onBrowseFeed, onClaimFromFinder }) {
  const cards = useCases(user, { onReportLost, onBrowseLost: onBrowseFeed, onClaimFromFinder });
  return (
    <section className="bg-white" id="use-cases">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <p className="text-sm font-semibold tracking-[0.25em] text-teal-600 uppercase">Guided Use Cases</p>
        <h2 className="text-3xl font-bold text-gray-900 mt-2">Exactly how Retrieva works</h2>
        <p className="mt-2 text-gray-600 max-w-3xl">
          Every listing follows the same handshake: a student reports what was lost, a finder responds from the feed,
          and the owner reviews the answer before sharing contact details. Use the quick actions below to jump to the right screen.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <article key={card.title} className="border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{card.subtitle}</p>
                <ul className="mt-4 space-y-2 text-sm text-gray-700 list-disc pl-5">
                  {card.steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                className="mt-6 inline-flex items-center justify-center rounded-lg border border-indigo-200 text-indigo-700 px-4 py-2 font-medium hover:bg-indigo-50"
                onClick={card.onClick}
              >
                {card.action}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
