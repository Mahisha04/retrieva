import { useState, useEffect, useMemo, useCallback } from "react";
import Fuse from "fuse.js";
import Filters from "./components/UI/Filters";
import ItemCard from "./components/UI/ItemCard";
import AddItem from "./components/AddItem";
import HowItWorks from "./components/UI/HowItWorks";
import ContactSection from "./components/UI/ContactSection";
import ProjectInspiration from "./components/UI/ProjectInspiration";
import FoundItemForm from "./components/FoundItemForm";
import FoundItemsGallery from "./components/FoundItemsGallery";
import FoundClaimModal from "./components/FoundClaimModal";
import FoundClaimsAdmin from "./components/FoundClaimsAdmin";
import FoundMyClaims from "./components/FoundMyClaims";
import FoundItemEditModal from "./components/FoundItemEditModal";
import React from 'react';
import {API}from "./config";
import supabase from "./supabaseClient";
// import supabase from "./supabaseClient";
import fallbackItems from "./data/items.json";

export default function HomePage({ onOpenAdd, user, onLogout, activeTab, setActiveTab, isAdmin = false }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState("All Status");
  const [sort, setSort] = useState("Date Reported");
  const [tab, setTab] = useState(activeTab || 'lost-board');
  const [myItemIds, setMyItemIds] = useState([]);
  const [unclaimedFoundItems, setUnclaimedFoundItems] = useState([]);
  const [loadingFoundItems, setLoadingFoundItems] = useState(false);
  const [foundClaims, setFoundClaims] = useState([]);
  const [loadingFoundClaims, setLoadingFoundClaims] = useState(false);
  const [myFoundClaims, setMyFoundClaims] = useState([]);
  const [loadingMyFoundClaims, setLoadingMyFoundClaims] = useState(false);
  const [claimModalItem, setClaimModalItem] = useState(null);
  const [editingFoundItem, setEditingFoundItem] = useState(null);
  const [deletingFoundItemId, setDeletingFoundItemId] = useState(null);
  const [myFoundItems, setMyFoundItems] = useState([]);
  const [loadingMyFoundItems, setLoadingMyFoundItems] = useState(false);
  const [finderDecisionClaimId, setFinderDecisionClaimId] = useState(null);
  const storageKey = useMemo(() => {
    const email = (user?.email || '').toLowerCase().trim();
    if (email) return `myItemIds:${email}`;
    const phoneDigits = (user?.phone || '').toString().replace(/\D+/g, '');
    return phoneDigits ? `myItemIds:phone:${phoneDigits}` : null;
  }, [user]);
  const ownedIdSet = useMemo(() => new Set((myItemIds || []).map((id) => String(id))), [myItemIds]);
  const ownedFoundIdSet = useMemo(() => new Set((myFoundItems || []).map((item) => String(item.id))), [myFoundItems]);

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
    let cancelled = false;

    const loadItems = async () => {
      try {
        const res = await fetch(API.url('/items'));
        if (!res.ok) throw new Error('failed-to-fetch');
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
        } else {
          setItems(fallbackItems);
        }
      } catch (e) {
        if (!cancelled) {
          setItems(fallbackItems);
        }
      }
    };

    loadItems();
    return () => {
      cancelled = true;
    };
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

  const scrollToId = useCallback((id) => {
    if (!id) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
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
  const returnedItems = (filtered || []).filter((i) => (i.type || "").toLowerCase() === "returned");

  const handleGetStarted = useCallback(() => {
    const loginTrigger = document.querySelector('[data-auth-trigger="login"]');
    if (loginTrigger) {
      loginTrigger.click();
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const ensureTab = useCallback((targetTab) => {
    if (!user) return false;
    setTab(targetTab);
    if (setActiveTab) setActiveTab(targetTab);
    return true;
  }, [user, setActiveTab]);

  

  const handleReviewFinderClaims = useCallback(() => {
    if (ensureTab('found-my-items')) {
      setTimeout(() => scrollToId('finder-items-panel'), 150);
    }
  }, [ensureTab, scrollToId]);

  const loadFoundItems = useCallback(async (status = 'unclaimed') => {
    setLoadingFoundItems(true);
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (user) params.append('includeClaims', 'true');
      const suffix = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(API.url(`/found-items${suffix}`));
      const data = await res.json();
      setUnclaimedFoundItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setUnclaimedFoundItems([]);
    } finally {
      setLoadingFoundItems(false);
    }
  }, [user]);

  const loadMyFoundItems = useCallback(async () => {
    const finderId = user?.id;
    if (!finderId) {
      setMyFoundItems([]);
      return;
    }
    setLoadingMyFoundItems(true);
    try {
      // Fetch found items for this finder, including related claims
      const { data: foundItems, error } = await supabase
        .from('found_items')
        .select('*, found_item_claims(*)')
        .eq('finder_id', finderId);
      if (error || !Array.isArray(foundItems)) {
        setMyFoundItems([]);
      } else {
        setMyFoundItems(foundItems);
      }
    } catch (e) {
      setMyFoundItems([]);
    } finally {
      setLoadingMyFoundItems(false);
    }
  }, [user]);

  const loadMyFoundClaims = useCallback(async () => {
    // Two-step Supabase query for finder claims
    setLoadingMyFoundClaims(true);
    try {
      const finderId = user?.id;
      if (!finderId) {
        setMyFoundClaims([]);
        setLoadingMyFoundClaims(false);
        return;
      }
      // Step 1: Fetch found items for this finder
      const { data: foundItems, error: foundItemsError } = await supabase
        .from('found_items')
        .select('id')
        .eq('finder_id', finderId);
      if (foundItemsError || !Array.isArray(foundItems) || foundItems.length === 0) {
        setMyFoundClaims([]);
        setLoadingMyFoundClaims(false);
        return;
      }
      const itemIds = foundItems.map(item => item.id);
      // Step 2: Fetch claims for those item IDs
      const { data: claims, error: claimsError } = await supabase
        .from('found_item_claims')
        .select('*')
        .in('found_item_id', itemIds);
      if (claimsError || !Array.isArray(claims)) {
        setMyFoundClaims([]);
      } else {
        setMyFoundClaims(claims);
      }
    } catch (e) {
      setMyFoundClaims([]);
    } finally {
      setLoadingMyFoundClaims(false);
    }
  }, [user]);

  const loadAllFoundClaims = useCallback(async () => {
    setLoadingFoundClaims(true);
    try {
      const res = await fetch(API.url('/found-item-claims?admin=true'));
      const data = await res.json();
      setFoundClaims(Array.isArray(data) ? data : []);
    } catch (e) {
      setFoundClaims([]);
    } finally {
      setLoadingFoundClaims(false);
    }
  }, []);

  const handleFoundClaimDecision = useCallback(async (claimId, action) => {
    if (!claimId || !action) return;
    try {
      const res = await fetch(API.url(`/found-item-claims/${claimId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to update claim');
      }
      loadAllFoundClaims();
      loadMyFoundClaims();
      loadFoundItems('unclaimed');
    } catch (e) {
      alert(e.message || 'Unable to update claim');
    }
  }, [loadAllFoundClaims, loadMyFoundClaims, loadFoundItems]);

  const handleFinderClaimDecision = useCallback(async (claimId, action) => {
    if (!claimId || !action) return;
    setFinderDecisionClaimId(claimId);
    try {
      const res = await fetch(API.url(`/found-item-claims/${claimId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, action }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || 'Failed to update claim');
      }
      loadMyFoundItems();
      loadFoundItems('unclaimed');
      loadMyFoundClaims();
    } catch (e) {
      alert(e.message || 'Unable to update claim');
    } finally {
      setFinderDecisionClaimId(null);
    }
  }, [loadMyFoundItems, loadFoundItems, loadMyFoundClaims]);

  const handleFoundClaimSubmitted = useCallback(() => {
    setClaimModalItem(null);
    loadMyFoundClaims();
    loadFoundItems('unclaimed');
  }, [loadMyFoundClaims, loadFoundItems]);

  const handleStartEditFoundItem = useCallback((item) => {
    setEditingFoundItem(item);
  }, []);

  const handleFoundItemUpdated = useCallback(() => {
    setEditingFoundItem(null);
    loadFoundItems('unclaimed');
    loadMyFoundItems();
  }, [loadFoundItems, loadMyFoundItems]);

  const handleDeleteFoundItem = useCallback(async (item) => {
    if (!item) return;
    if (typeof window !== 'undefined') {
      const confirmDelete = window.confirm('Delete this found item? This action cannot be undone.');
      if (!confirmDelete) return;
    }
    const finderId = (user?.id || user?.email || user?.phone || '').toString().trim().toLowerCase();
    const phoneDigits = (user?.phone || '').toString().replace(/\D+/g, '');
    setDeletingFoundItemId(item.id);
    try {
      const res = await fetch(API.url(`/found-items/${item.id}`), {
        method: 'DELETE',
        headers: {
          'X-User-Id': finderId || '',
          'X-User-Email': user?.email || '',
          'X-User-Phone': phoneDigits || '',
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || 'Failed to delete found item');
      }
      loadFoundItems('unclaimed');
      loadMyFoundItems();
    } catch (e) {
      alert(e.message || 'Unable to delete found item');
    } finally {
      setDeletingFoundItemId(null);
    }
  }, [user, loadFoundItems, loadMyFoundItems]);

  useEffect(() => {
    if (tab === 'found-unclaimed') {
      loadFoundItems('unclaimed');
      loadMyFoundItems();
    }
    if (tab === 'found-my-claims') {
      loadMyFoundClaims();
    }
    if (tab === 'found-my-items') {
      loadMyFoundItems();
    }
    if (tab === 'found-approvals' && isAdmin) {
      loadAllFoundClaims();
    }
  }, [tab, loadFoundItems, loadMyFoundClaims, loadAllFoundClaims, loadMyFoundItems, isAdmin]);

  useEffect(() => {
    if (!isAdmin && tab === 'found-approvals') {
      const fallbackTab = 'found-unclaimed';
      setTab(fallbackTab);
      if (setActiveTab) setActiveTab(fallbackTab);
    }
  }, [tab, isAdmin, setActiveTab]);

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
    const returnedOwned = userItems.filter(i => (i.type || '').toLowerCase() === 'returned');

    return (
      <>
        <div className="bg-gray-100 min-h-screen py-8">
          <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-semibold">Welcome, {user.name ? user.name.split(' ')[0] : user.email}</h2>
          </div>

          <div className="mt-6 space-y-6">
            {tab === 'lost-board' && (
              <div id="lost-board-section" className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">Lost Items</h3>
                    <p className="text-sm text-gray-600">Public posts from students who misplaced something. Use the filters above to narrow the list.</p>
                  </div>
                </div>
                {lostItems.length === 0 ? (
                  <div className="text-gray-500">No lost items found.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {lostItems.map((i) => (
                      <ItemCard key={i.id} item={i} user={user} ownedIdSet={ownedIdSet} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'found-board' && (
              <div id="found-board-section" className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">Found Items</h3>
                    <p className="text-sm text-gray-600">Items reported as found and waiting for their owners to reach out.</p>
                  </div>
                </div>
                {foundItems.length === 0 ? (
                  <div className="text-gray-500">No found items yet.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {foundItems.map((i) => (
                      <ItemCard key={i.id} item={i} user={user} ownedIdSet={ownedIdSet} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'returned-items' && (
              <div id="returned-board-section" className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">Items Returned</h3>
                    <p className="text-sm text-gray-600">Matches that were completed after owners confirmed the hand-off.</p>
                  </div>
                </div>
                {returnedItems.length === 0 ? (
                  <div className="text-gray-500">No returned items yet.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {returnedItems.map((i) => (
                      <ItemCard key={`returned-tab-${i.id}`} item={i} user={user} ownedIdSet={ownedIdSet} />
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

                      <div>
                        <h4 className="text-lg font-semibold mb-3">Items Returned</h4>
                        {returnedOwned.length === 0 ? (
                          <div className="text-gray-500 text-sm">No items have been marked as returned yet.</div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {returnedOwned.map((i) => (
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
                    containerId="owner-approvals"
                  />
                </div>
              </div>
            )}

            {tab === 'add' && (
              <div id="report-lost-panel">
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

            {tab === 'report-found' && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">Report a Found Item</h3>
                <FoundItemForm
                  user={user}
                  onSubmitted={() => {
                    loadFoundItems('unclaimed');
                    loadMyFoundItems();
                    alert('Found item submitted. We will list it in the unclaimed board.');
                  }}
                />
              </div>
            )}

            {tab === 'found-unclaimed' && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">Found Items (Unclaimed)</h3>
                    <p className="text-sm text-gray-600">Spotted on campus but not yet collected.</p>
                  </div>
                  <button
                    className="text-sm text-teal-600 hover:underline"
                    onClick={() => loadFoundItems('unclaimed')}
                  >
                    Refresh
                  </button>
                </div>
                <FoundItemsGallery
                  items={unclaimedFoundItems}
                  loading={loadingFoundItems}
                  onClaim={(item) => setClaimModalItem(item)}
                  currentUser={user}
                  onEdit={handleStartEditFoundItem}
                  onDelete={handleDeleteFoundItem}
                  deletingId={deletingFoundItemId}
                  ownedFoundIds={ownedFoundIdSet}
                  onReviewClaims={handleReviewFinderClaims}
                />
              </div>
            )}

            {tab === 'found-my-items' && (
              <div id="finder-items-panel" className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">My Found Items</h3>
                  <button
                    className="text-sm text-teal-600 hover:underline"
                    onClick={loadMyFoundItems}
                  >
                    Refresh
                  </button>
                </div>
                {myFoundItems.length === 0 ? (
                  <div className="text-gray-500">You have not reported any found items yet.</div>
                ) : (
                  myFoundItems.map(item => (
                    <div key={item.id} className="mb-8 border rounded-xl bg-white p-4 shadow-sm">
                      <div className="flex gap-4 items-center">
                        <div>
                          <div className="text-xs uppercase text-gray-500">ITEM</div>
                          <div className="text-lg font-bold">{item.item_name}</div>
                          <div className="text-sm text-gray-600">{item.description}</div>
                          <div className="text-xs text-gray-500 mt-1">Location: {item.location_found || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">Status: {item.status}</div>
                        </div>
                        {item.image_url && (
                          <img src={item.image_url} alt={item.item_name} className="w-32 h-32 object-cover rounded" />
                        )}
                      </div>
                      <div className="mt-4">
                        {Array.isArray(item.found_item_claims) && item.found_item_claims.length > 0 ? (
                          item.found_item_claims.map(claim => (
                            <div key={claim.id} className="border rounded bg-gray-50 p-3 mb-3">
                              <div className="flex gap-4 items-center">
                                <div className="flex-1">
                                  <div className="font-semibold">Claimant: {claim.claimant_name || 'Unknown'}</div>
                                  <div className="text-sm">Contact: {claim.claimant_contact}</div>
                                  <div className="text-xs text-gray-500">Status: {claim.status}</div>
                                  <div className="text-xs text-gray-500">Submitted: {claim.created_at ? new Date(claim.created_at).toLocaleString() : 'Unknown'}</div>
                                </div>
                                {claim.proof_photo_url && (
                                  <img src={claim.proof_photo_url} alt="Proof" className="w-24 h-24 object-cover rounded" />
                                )}
                              </div>
                              <div className="mt-2 flex gap-2">
                                {claim.status === 'pending' && (
                                  <>
                                    <button
                                      className="px-4 py-2 bg-green-600 text-white rounded"
                                      onClick={() => handleFinderClaimDecision(claim.id, 'approve')}
                                      disabled={finderDecisionClaimId === claim.id}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      className="px-4 py-2 bg-red-600 text-white rounded"
                                      onClick={() => handleFinderClaimDecision(claim.id, 'reject')}
                                      disabled={finderDecisionClaimId === claim.id}
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500">No claims yet</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'found-my-claims' && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">My Found Item Claims</h3>
                  <button className="text-sm text-teal-600 hover:underline" onClick={loadMyFoundClaims}>
                    Refresh
                  </button>
                </div>
                <FoundMyClaims claims={myFoundClaims} loading={loadingMyFoundClaims} />
              </div>
            )}

            {isAdmin && tab === 'found-approvals' && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Found Item Approvals</h3>
                  <button className="text-sm text-teal-600 hover:underline" onClick={loadAllFoundClaims}>
                    Refresh
                  </button>
                </div>
                <FoundClaimsAdmin
                  claims={foundClaims}
                  loading={loadingFoundClaims}
                  onDecision={handleFoundClaimDecision}
                  onRefresh={loadAllFoundClaims}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      {claimModalItem && (
          <FoundClaimModal
            item={claimModalItem}
            onClose={() => setClaimModalItem(null)}
            onSubmitted={handleFoundClaimSubmitted}
            user={user}
          />
        )}
      {editingFoundItem && (
        <FoundItemEditModal
          item={editingFoundItem}
          onClose={() => setEditingFoundItem(null)}
          onUpdated={handleFoundItemUpdated}
          user={user}
        />
      )}
      </>
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

function FinderFoundItemsBoard({ items = [], loading = false, onDecision, updatingClaimId, onEdit, onDelete, deletingId, user }) {
  if (loading) {
    return <div className="text-gray-500">Loading your found items…</div>;
  }
  if (!items || items.length === 0) {
    return <div className="text-gray-500">You have not reported any found items yet.</div>;
  }

  return (
    <div className="space-y-5">
      {items.map((item) => {
        const claims = Array.isArray(item.found_item_claims) ? [...item.found_item_claims] : [];
        claims.sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0));
        const latestClaim = claims[0] || null;
        const claimStatus = latestClaim?.status || null;
        let statusCopy = 'No claims yet';
        if (claimStatus === 'pending') {
          statusCopy = 'Owner requested this item — Pending your approval';
        } else if (claimStatus === 'approved') {
          statusCopy = 'Owner verified. Contact owner to return item.';
        } else if (claimStatus === 'rejected') {
          statusCopy = 'You rejected this claim';
        }
        const claimId = latestClaim?.claim_id || latestClaim?.id || null;
        const isUpdating = claimId && updatingClaimId && String(claimId) === String(updatingClaimId);

        return (
          <div key={item.id} className="border rounded-xl bg-white shadow-sm p-5">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="text-xs uppercase text-gray-500">Item</div>
                <div className="text-lg font-semibold text-gray-900">{item.item_name || `Item #${item.id}`}</div>
                <div className="text-sm text-gray-600 mt-1">{item.description || 'No description provided.'}</div>
                <div className="text-xs text-gray-500 mt-1">Location: {item.location_found || 'Unknown'}</div>
                <div className="text-xs text-gray-500">Status: {(item.status || 'unclaimed').toUpperCase()}</div>
                {latestClaim?.claimant_contact && (
                  <div className="text-xs text-gray-500">Owner contact shared: {latestClaim.claimant_contact}</div>
                )}
              </div>
              <div className="w-full md:w-40 h-40 bg-gray-100 rounded-lg overflow-hidden border">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.item_name || 'Found item'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
                )}
              </div>
            </div>

            <div className="mt-4 text-sm font-medium text-gray-800">{statusCopy}</div>

            {latestClaim && (
              <div className="mt-3 text-sm text-gray-600">
                <div className="font-semibold text-gray-700">Latest claim details</div>
                <div>Owner: {latestClaim.claimant_name || 'Unknown owner'}</div>
                <div>Contact: {latestClaim.claimant_contact || 'Not provided'}</div>
                <div>Submitted: {latestClaim.created_at ? new Date(latestClaim.created_at).toLocaleString() : 'Unknown'}</div>
              </div>
            )}

            {latestClaim?.proof_photo_url && (
              <div className="mt-3">
                <div className="text-xs uppercase text-gray-500 mb-1">Proof Photo</div>
                <img src={latestClaim.proof_photo_url} alt="Proof" className="w-full max-h-72 object-cover rounded-lg border" />
              </div>
            )}

            {claimStatus === 'approved' && (
              <div className="mt-4 p-4 border border-green-200 rounded-lg bg-green-50 text-gray-900">
                <div className="text-xs uppercase text-gray-600">Owner Contact</div>
                <div className="text-base font-semibold">{latestClaim.claimant_contact || 'Not provided'}</div>
                {latestClaim.claimant_name && <div className="text-sm">{latestClaim.claimant_name}</div>}
              </div>
            )}

            {claimStatus === 'pending' && (
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded"
                  disabled={!onDecision || isUpdating}
                  onClick={() => claimId && onDecision && onDecision(claimId, 'approve')}
                >
                  {isUpdating && onDecision ? 'Approving…' : 'Approve Claim'}
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded"
                  disabled={!onDecision || isUpdating}
                  onClick={() => claimId && onDecision && onDecision(claimId, 'reject')}
                >
                  {isUpdating && onDecision ? 'Rejecting…' : 'Reject Claim'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PendingClaims({ ownerEmail, ownerPhone, ownedIds, onAction, items = [], containerId }) {
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
    <div className="mt-3 space-y-4" id={containerId || undefined}>
      <p className="text-sm text-gray-600">
        Compare the finder's answer with what you know. Approve to share your contact or reject to keep looking.
      </p>
      {claims.map((c) => {
        const created = c.createdAt ? new Date(c.createdAt).toLocaleString() : 'Unknown date';
        const linkedItem = itemLookup.get(String(c.itemId ?? c.item_id ?? '')) || null;
        const question = c.securityQuestion || linkedItem?.security_question || linkedItem?.securityQuestion || 'No security question was set for this item.';
        const finderAnswer = c.finderAnswer ?? c.finder_answer ?? c.answer ?? c.answer_text ?? c.securityAnswer ?? c.response ?? null;
        const answerMatches = c.answerIsCorrect === true;
        const answerMismatched = c.answerIsCorrect === false;
        const itemName = linkedItem?.name || c.itemName || `Item #${c.itemId ?? c.item_id ?? ''}`;
        const itemLocation = linkedItem?.location || 'No location noted';
        const itemDescription = linkedItem?.description || 'No description provided.';
        const itemImage = linkedItem?.image_url || null;
        const proofPhotoUrl = c.proofPhotoUrl || c.proof_photo_url || null;

        return (
          <div key={c.id} className="p-4 border rounded-xl bg-white shadow-sm">
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <div className="text-xs uppercase tracking-wide text-gray-500">Item</div>
                <div className="text-lg font-semibold text-gray-900">{itemName}</div>
                <div className="text-sm text-gray-600 mt-1">{itemDescription}</div>
                <div className="text-xs text-gray-500 mt-1">Location: {itemLocation}</div>
              </div>
              {itemImage && (
                <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-100">
                  <img src={itemImage} alt={itemName} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Your Question</div>
            <div className="text-base font-semibold text-gray-900">{question}</div>

            <div className="mt-3 border rounded-lg overflow-hidden text-sm text-gray-700">
              <div className="px-4 py-3 border-b">
                <div className="text-xs uppercase text-gray-500 mb-1">Answer Submitted</div>
                <div className="text-base font-semibold text-gray-900 whitespace-pre-line">
                  {finderAnswer?.trim() ? finderAnswer : 'Finder did not provide an answer.'}
                </div>
                {answerMatches && (
                  <div className="text-xs text-green-600 mt-1">Matches the verification answer you noted.</div>
                )}
                {answerMismatched && (
                  <div className="text-xs text-red-600 mt-1">Does not match the verification answer you noted.</div>
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
                      Reject
                    </button>
                    <button
                      className="px-4 py-1.5 rounded font-semibold bg-blue-600 text-white"
                      onClick={() => doAction(c.id, 'approve')}
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {proofPhotoUrl && (
              <div className="mt-4">
                <div className="text-xs uppercase text-gray-500 mb-1">Proof Photo</div>
                <div className="rounded-lg border bg-gray-50 p-3 flex flex-col gap-2">
                  <img src={proofPhotoUrl} alt={`Proof for ${itemName}`} className="w-full max-h-64 object-cover rounded" />
                  <a
                    href={proofPhotoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Open full size
                  </a>
                </div>
              </div>
            )}

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

  const formatPhone = React.useCallback((value) => {
    if (!value) return null;
    const digits = value.toString().replace(/\D+/g, '');
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits[0]} ${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 12 && digits.startsWith('91')) {
      return `+${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    return digits || value;
  }, []);

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
            const ownerPhoneFormatted = formatPhone(c.ownerPhone || c.ownerPhoneDigits || null);
            const ownerEmail = c.ownerEmail || null;
            const proofPhotoUrl = c.proofPhotoUrl || c.proof_photo_url || null;
            return (
              <div key={c.id} className="p-3 rounded-lg border bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-900">{c.itemName || `Item #${c.itemId}`}</div>
                  <div className="text-sm text-gray-600 capitalize">Status: {c.status}</div>
                  {proofPhotoUrl && (
                    <div className="mt-2">
                      <div className="text-xs uppercase text-gray-500">Proof Photo</div>
                      <img src={proofPhotoUrl} alt="Proof" className="mt-1 w-40 h-24 object-cover rounded border" />
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
                  {c.status === 'pending' && (
                    <div className="mt-1 text-gray-500">Waiting for owner approval</div>
                  )}
                  {c.status === 'rejected' && (
                    <div className="mt-1 text-sm text-red-600 font-medium">Request Rejected.</div>
                  )}
                  {c.status === 'approved' && (
                    <div className="mt-3 p-3 rounded border border-green-200 bg-white text-gray-900">
                      <div className="text-xs uppercase text-gray-500">Contact the Owner</div>
                      {ownerPhoneFormatted ? (
                        <div className="text-base font-semibold text-green-800 mt-1">{ownerPhoneFormatted}</div>
                      ) : null}
                      {ownerEmail ? (
                        <div className="text-sm text-green-900 mt-1">{ownerEmail}</div>
                      ) : null}
                      {!ownerPhoneFormatted && !ownerEmail && (
                        <div className="text-sm text-gray-700 mt-1">Owner contact unavailable.</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">Use this info to coordinate pickup.</div>
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
