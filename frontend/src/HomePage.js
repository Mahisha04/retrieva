import { useState, useEffect, useMemo, useCallback } from "react";
import Fuse from "fuse.js";
import Filters from "./components/UI/Filters";
import ItemCard from "./components/UI/ItemCard";
import AddItem from "./components/AddItem";
import HowItWorks from "./components/UI/HowItWorks";
import ContactSection from "./components/UI/ContactSection";
import ProjectInspiration from "./components/UI/ProjectInspiration";
import React from 'react';
import {API}from "./config";

export default function HomePage({ onOpenAdd, user, onLogout, activeTab, setActiveTab }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState("All Status");
  const [sort, setSort] = useState("Date Reported");
  const [tab, setTab] = useState(activeTab || 'feed');
  const [myItemIds, setMyItemIds] = useState([]);
  const storageKey = useMemo(() => {
    const email = (user?.email || '').toLowerCase().trim();
    if (email) return `myItemIds:${email}`;
    const phoneDigits = (user?.phone || '').toString().replace(/\D+/g, '');
    return phoneDigits ? `myItemIds:phone:${phoneDigits}` : null;
  }, [user]);
  const ownedIdSet = useMemo(() => new Set((myItemIds || []).map((id) => String(id))), [myItemIds]);

  useEffect(() => {
    if (activeTab && activeTab !== tab) {
      setTab(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (tab === 'responses') {
      setTimeout(() => {
        const el = document.getElementById('finder-responses');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [tab]);

  useEffect(() => {
    fetch(`${API}/items`)
      .then((res) => res.json())
      .then((data) => setItems(data));
  }, []);

  useEffect(() => {
    const handleUpdate = (event) => {
      const updated = event?.detail;
      if (!updated || updated.id === undefined || updated.id === null) return;
      setItems((prev) => {
        if (!Array.isArray(prev)) return prev;
        let replaced = false;
        const mapped = prev.map((entry) => {
          const entryId = entry && entry.id !== undefined ? entry.id : entry?.item_id;
          if (entryId !== undefined && String(entryId) === String(updated.id)) {
            replaced = true;
            return { ...entry, ...updated };
          }
          return entry;
        });
        return replaced ? mapped : prev;
      });
    };

    const handleDelete = (event) => {
      const id = event?.detail?.id ?? event?.detail;
      if (id === undefined || id === null) return;
      setItems((prev) => {
        if (!Array.isArray(prev)) return prev;
        return prev.filter((entry) => {
          const entryId = entry && entry.id !== undefined ? entry.id : entry?.item_id;
          return String(entryId) !== String(id);
        });
      });
    };

    window.addEventListener('item-updated', handleUpdate);
    window.addEventListener('item-deleted', handleDelete);
    return () => {
      window.removeEventListener('item-updated', handleUpdate);
      window.removeEventListener('item-deleted', handleDelete);
    };
  }, []);

  const refreshIds = useCallback(() => {
    if (!storageKey) {
      setMyItemIds([]);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey) || '[]';
      const parsed = JSON.parse(raw);
      setMyItemIds(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      setMyItemIds([]);
    }
  }, [storageKey]);

  useEffect(() => {
    refreshIds();
  }, [refreshIds]);

  useEffect(() => {
    if (!storageKey) return;
    const handler = (event) => {
      const eventKey = event?.key || event?.detail?.storageKey || null;
      if (eventKey && eventKey !== storageKey) return;
      refreshIds();
    };
    window.addEventListener('storage', handler);
    window.addEventListener('myitems-changed', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('myitems-changed', handler);
    };
  }, [storageKey, refreshIds]);

  const filtered = useMemo(() => {
    let base = items || [];

    if (search) {
      const fuse = new Fuse(base, {
        keys: ["name", "location", "type", "category", "description"],
        threshold: 0.35,
      });
      base = fuse.search(search).map((r) => r.item);
    }

    if (category && category !== "All Categories") {
      base = base.filter((i) => (i.category || "").toLowerCase() === category.toLowerCase());
    }

    if (status && status !== "All Status") {
      base = base.filter((i) => (i.type || "").toLowerCase() === status.toLowerCase());
    }

    if (sort === "Name") {
      base = base.slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else {
      base = base.slice().sort((a, b) => {
        const aDate = new Date(a.date_reported || a.reported_at || a.created_at || 0).getTime();
        const bDate = new Date(b.date_reported || b.reported_at || b.created_at || 0).getTime();
        return bDate - aDate;
      });
    }

    return base;
  }, [items, search, category, status, sort]);

  // Split filtered results into Lost vs Found for the feed
  const lostItems = (filtered || []).filter((i) => (i.type || "").toLowerCase() === "lost");
  const foundItems = (filtered || []).filter((i) => (i.type || "").toLowerCase() === "found");

  const handleGetStarted = useCallback(() => {
    const loginTrigger = document.querySelector('[data-auth-trigger="login"]');
    if (loginTrigger) {
      loginTrigger.click();
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // user dashboard view when logged in
  if (user) {
    const userEmail = (user.email || "").toLowerCase();
    const userItems = (items || []).filter(i => {
      const contactMatch = ((i.contact || "").toLowerCase() === userEmail);
      const idKey = (i.id !== undefined && i.id !== null) ? String(i.id) : null;
      const trackedMatch = idKey ? ownedIdSet.has(idKey) : false;
      return contactMatch || trackedMatch;
    });
    const lost = userItems.filter(i => (i.type || '').toLowerCase() === 'lost');
    const found = userItems.filter(i => (i.type || '').toLowerCase() === 'found');

    return (
      <div className="bg-gray-100 min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-semibold">Welcome, {user.name ? user.name.split(' ')[0] : user.email}</h2>
          </div>

          <div className="mt-6">
            {tab === 'feed' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Lost Items</h3>
                {lostItems.length === 0 ? (
                  <div className="text-gray-500">No lost items found.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {lostItems.map((i) => (
                      <ItemCard key={i.id} item={i} user={user} ownedIdSet={ownedIdSet} />
                    ))}
                  </div>
                )}

                <h3 className="text-xl font-semibold mt-8 mb-4">Found Items</h3>
                {foundItems.length === 0 ? (
                  <div className="text-gray-500">No found items found.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {foundItems.map((i) => (
                      <ItemCard key={i.id} item={i} user={user} ownedIdSet={ownedIdSet} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'listings' && (
              <div className="flex justify-start">
                <div className="w-full md:w-2/3 lg:w-1/2">
                  {userItems.length === 0 ? (
                    <div className="text-gray-500">You have no items yet. Click Add Item to create one.</div>
                  ) : (
                    <div className="space-y-8">
                      <div>
                        <h4 className="text-lg font-semibold mb-3">Lost items</h4>
                        {lost.length === 0 ? (
                          <div className="text-gray-500 text-sm">No lost items yet.</div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {lost.map((i) => (
                              <ItemCard key={i.id} item={i} user={user} ownedIdSet={ownedIdSet} />
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold mb-3">Found items</h4>
                        {found.length === 0 ? (
                          <div className="text-gray-500 text-sm">No found items yet.</div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {found.map((i) => (
                              <ItemCard key={i.id} item={i} user={user} ownedIdSet={ownedIdSet} />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                        <h4 className="text-lg font-semibold mb-3">Pending Requests</h4>
                        <PendingClaims
                          ownerEmail={user.email}
                          ownerPhone={user.phone}
                          ownedIds={myItemIds}
                          onAction={() => window.location.reload()}
                          items={items}
                        />
                      </div>

                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'responses' && (
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm" id="finder-responses">
                  <h4 className="text-lg font-semibold mb-3">Finder Requests</h4>
                  <FinderClaims finderContact={user.email} />
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h4 className="text-lg font-semibold mb-3">Owner Approvals</h4>
                  <PendingClaims
                    ownerEmail={user.email}
                    ownerPhone={user.phone}
                    ownedIds={myItemIds}
                    onAction={() => window.location.reload()}
                    items={items}
                  />
                </div>
              </div>
            )}

            {tab === 'add' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Add Item</h3>
                <div className="bg-white p-6 rounded shadow">
                  <AddItem
                    onClose={null}
                    formRef={null}
                    showButtons={true}
                    user={user}
                    onUploaded={(newItem) => {
                      setItems((prev) => [newItem, ...(prev || [])]);
                      setTab('listings');
                      if (setActiveTab) setActiveTab('listings');
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {!user && (
        <>
          <ProjectInspiration onGetStarted={handleGetStarted} />
          <HowItWorks />
        </>
      )}

      {user ? (
        <>
          <div className="max-w-6xl mx-auto -mt-12 px-6">
            <div className="rounded-xl bg-white shadow-md p-4">
              <Filters
                search={search}
                setSearch={setSearch}
                category={category}
                setCategory={setCategory}
                status={status}
                setStatus={setStatus}
                sort={sort}
                setSort={setSort}
                showSearch={false}
              />
            </div>
          </div>

          {/* featured horizontal strip */}
          <div className="max-w-6xl mx-auto mt-6 px-6">
            <h3 className="text-lg font-semibold mb-3">Featured</h3>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {(items || []).slice(0, 6).map((it) => (
                <div key={it.id} className="w-64 flex-shrink-0">
                  <ItemCard item={it} user={user} ownedIdSet={ownedIdSet} />
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-5xl mx-auto mt-6">
            {(() => {
              const featuredIds = new Set((items || []).slice(0, 6).map((i) => i.id));
              const main = filtered.filter((it) => !featuredIds.has(it.id));
              const mainLost = main.filter((i) => (i.type || "").toLowerCase() === "lost");
              const mainFound = main.filter((i) => (i.type || "").toLowerCase() === "found");

              if (mainLost.length === 0 && mainFound.length === 0) {
                return (
                  <div className="col-span-full text-center text-gray-500 py-12">
                    No results found. Try different search terms or filters.
                  </div>
                );
              }

              return (
                <>
                  {mainLost.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Lost items</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {mainLost.map((item) => (
                          <ItemCard key={item.id} item={item} user={user} ownedIdSet={ownedIdSet} />
                        ))}
                      </div>
                    </div>
                  )}

                  {mainFound.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-3">Found items</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {mainFound.map((item) => (
                          <ItemCard key={item.id} item={item} user={user} ownedIdSet={ownedIdSet} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </>
      ) : null}

      {!user && <ContactSection />}
    </div>
  );
}

function PendingClaims({ ownerEmail, ownerPhone, ownedIds, onAction, items = [] }) {
  const [claims, setClaims] = React.useState([]);
  const normalizedOwnedIds = React.useMemo(() => {
    return (ownedIds || [])
      .map((id) => (id === undefined || id === null) ? '' : id.toString().trim())
      .filter(Boolean);
  }, [ownedIds]);
  const itemLookup = React.useMemo(() => {
    const map = new Map();
    (items || []).forEach((it) => {
      if (it && it.id !== undefined && it.id !== null) {
        map.set(String(it.id), it);
      }
    });
    return map;
  }, [items]);

  React.useEffect(() => {
    // fetch pending claims from backend
    async function load() {
      try {
        const params = new URLSearchParams();
        if (ownerEmail) params.append('ownerEmail', ownerEmail);
        if (ownerPhone) {
          const digits = ownerPhone.toString().replace(/\D+/g, '');
          if (digits) params.append('ownerPhone', digits);
        }
        if (normalizedOwnedIds.length > 0) {
          normalizedOwnedIds.forEach((id) => params.append('itemIds', id));
        }
        const suffix = params.toString() ? `?${params.toString()}` : '';
        const res = await fetch(API.url(`/claims${suffix}`));
        const data = await res.json();
        setClaims((data || []).filter(c => c.status === 'pending'));
      } catch (e) {
        setClaims([]);
      }
    }
    load();
  }, [ownerEmail, ownerPhone, normalizedOwnedIds]);

  async function doAction(claimId, action) {
    try {
      const payload = { action };
      if (action === 'approve' && ownerPhone) {
        const digits = ownerPhone.toString().replace(/\D+/g, '');
        if (digits) payload.ownerPhone = digits;
      }
      const res = await fetch(API.url(`/claims/${claimId}`), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'failed');
      setClaims(prev => prev.filter(c => c.id !== claimId));
      if (onAction) onAction();
      if (action === 'approve') alert('Request approved. Finder will be notified.');
    } catch (e) {
      alert('Failed to update request: ' + e.message);
    }
  }

  if (!claims || claims.length === 0) return <div className="text-gray-500 mt-2">No pending requests.</div>;

  return (
    <div className="mt-3 space-y-4">
      {claims.map((c) => {
        const created = c.createdAt ? new Date(c.createdAt).toLocaleString() : 'Unknown date';
        const linkedItem = itemLookup.get(String(c.itemId ?? c.item_id ?? '')) || null;
        const question = c.securityQuestion || linkedItem?.security_question || linkedItem?.securityQuestion || 'No security question was set for this item.';
        const finderAnswer = c.finderAnswer ?? c.finder_answer ?? c.answer ?? c.answer_text ?? c.securityAnswer ?? c.response ?? null;
        const answerMatches = c.answerIsCorrect === true;
        const answerMismatched = c.answerIsCorrect === false;

        const handleApprove = () => {
          doAction(c.id, 'approve');
        };

        const handleOverride = () => {
          const confirmed = window.confirm('Answer mismatch detected. Approve anyway and share your contact details with this finder?');
          if (!confirmed) return;
          doAction(c.id, 'approve');
        };
        return (
          <div key={c.id} className="p-4 border rounded-xl bg-white shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Your Question</div>
            <div className="text-base font-semibold text-gray-900">{question}</div>

            <div className="mt-3 border rounded-lg overflow-hidden text-sm text-gray-700">
              <div className="px-4 py-3 border-b">
                <div className="text-xs uppercase text-gray-500 mb-1">Answer Submitted</div>
                <div className="text-base font-semibold text-gray-900 whitespace-pre-line">
                  {finderAnswer?.trim() ? finderAnswer : 'Finder did not provide an answer.'}
                </div>
                {answerMatches && (
                  <div className="text-xs text-green-600 mt-1">Matches the answer you provided.</div>
                )}
                {answerMismatched && (
                  <div className="text-xs text-red-600 mt-1">
                    Does not match your stored answer. Use the override control below only if you personally verified the finder.
                  </div>
                )}
              </div>
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <span className="font-medium text-gray-600">Date</span>
                <span className="text-gray-800">{created}</span>
              </div>
              <div className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-xs uppercase text-gray-500">Finder</div>
                  <div className="text-sm text-gray-800">{c.finderContact || 'Unknown finder'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Validate:</span>
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-1.5 rounded bg-red-100 text-red-600 font-semibold"
                      onClick={() => doAction(c.id, 'reject')}
                    >
                      No
                    </button>
                    <button
                      className={`px-4 py-1.5 rounded font-semibold ${answerMismatched ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white'}`}
                      onClick={() => !answerMismatched && handleApprove()}
                      disabled={answerMismatched}
                    >
                      Yes
                    </button>
                    {answerMismatched && (
                      <button
                        className="px-4 py-1.5 rounded font-semibold border border-red-300 text-red-600"
                        onClick={handleOverride}
                        type="button"
                      >
                        Override
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-2">
              If you approve, we will notify the finder with your contact details.
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FinderClaims({ finderContact }) {
  const [claims, setClaims] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const loadClaims = useCallback(async () => {
    if (!finderContact) {
      setClaims([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(API.url(`/claims?finderContact=${encodeURIComponent(finderContact)}`));
      const data = await res.json();
      setClaims(Array.isArray(data) ? data : []);
    } catch (e) {
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, [finderContact]);

  React.useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  if (!finderContact) return null;

  return (
    <div className="bg-white border border-indigo-100 rounded-xl p-4 shadow-sm" id="finder-responses">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
        <div>
          <h4 className="text-lg font-semibold">Your responses</h4>
          <p className="text-sm text-gray-500">Answers you submitted after finding items.</p>
        </div>
        <button
          type="button"
          className="text-sm text-teal-600 hover:underline disabled:text-gray-400"
          onClick={loadClaims}
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {claims === null || claims.length === 0 ? (
        <div className="text-sm text-gray-500">No responses yet. Submit an answer on a found item to see it here.</div>
      ) : (
        <div className="space-y-3">
          {claims.map((c) => {
            const finderAnswer = c.finderAnswer ?? c.finder_answer ?? c.answer ?? c.answer_text ?? c.securityAnswer ?? c.response ?? null;
            return (
              <div key={c.id} className="p-3 rounded-lg border bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-900">{c.itemName || `Item #${c.itemId}`}</div>
                  <div className="text-sm text-gray-600 capitalize">Status: {c.status}</div>
                  {c.status === 'approved' && (
                    <div className="mt-1 text-sm text-green-700 font-medium">
                      Owner phone: {c.ownerPhone || 'Not provided'}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  <div>Requested: {new Date(c.createdAt).toLocaleString()}</div>
                  {finderAnswer && (
                    <div className="mt-1 text-gray-700">
                      Finder answer: <span className="font-medium whitespace-pre-line">{finderAnswer}</span>
                    </div>
                  )}
                  {c.status === 'approved' && c.ownerEmail && (
                    <div className="mt-1 text-gray-700">Owner Email: {c.ownerEmail}</div>
                  )}
                  {c.status !== 'approved' && (
                    <div className="mt-1 text-gray-500">Waiting for owner approval</div>
                  )}
                  {c.status === 'approved' && (
                    <div className="mt-2">
                      <button
                        type="button"
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
                        onClick={() => {
                          const contact = c.ownerPhone || c.ownerEmail || 'Owner contact unavailable';
                          alert(`Here is the contact: ${contact}`);
                        }}
                      >
                        Show Number
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
