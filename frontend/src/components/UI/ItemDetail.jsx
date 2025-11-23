import React, { useState } from "react";
import axios from "axios";
import VerifyModal from "./VerifyModal";
import EditItemModal from "./EditItemModal";
import { API } from "../../config";
import * as Icons from "./Icons";

function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  try {
    return dt.toLocaleString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch (e) {
    return d;
  }
}

export default function ItemDetail({ item, onClose, user, ownedIdSet }) {
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimConfirmOpen, setClaimConfirmOpen] = useState(false);
  const [ownerClaimOpen, setOwnerClaimOpen] = useState(false);
  const [itemData, setItemData] = useState(item);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const currentItem = itemData || item;
  const ownerPhoneDigits = React.useMemo(() => (user?.phone ? user.phone.toString().replace(/\D+/g, "") : ""), [user]);
  const ownedIdList = React.useMemo(() => Array.from(ownedIdSet || new Set()), [ownedIdSet]);
  const storedContactLower = (currentItem?.contact || '').toString().toLowerCase();
  const storedContactDigits = (currentItem?.contact || '').toString().replace(/\D+/g, '');
  const emailOwned = user && currentItem && ((user.email || '').toLowerCase() === storedContactLower);
  const phoneOwned = Boolean(user && ownerPhoneDigits && storedContactDigits && ownerPhoneDigits === storedContactDigits);
  const contactOwned = emailOwned || phoneOwned;
  const trackedOwned = currentItem && currentItem.id !== undefined ? ownedIdSet?.has(String(currentItem.id)) : false;
  const canEdit = contactOwned || trackedOwned;
  const isOwner = canEdit;
  const isLost = ((currentItem?.type || '').toLowerCase() === 'lost');
  const storageKey = React.useMemo(() => {
    if (!user) return null;
    const email = (user.email || '').toLowerCase().trim();
    if (email) return `myItemIds:${email}`;
    return ownerPhoneDigits ? `myItemIds:phone:${ownerPhoneDigits}` : null;
  }, [user, ownerPhoneDigits]);

  const removeStoredId = (id) => {
    if (!storageKey || id === undefined || id === null) return;
    try {
      const raw = localStorage.getItem(storageKey) || '[]';
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const normalized = String(id);
      const next = parsed.filter((entry) => entry !== normalized);
      localStorage.setItem(storageKey, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('myitems-changed', { detail: { storageKey } }));
    } catch (e) {
      // ignore storage errors
    }
  };

  const handleDelete = async () => {
    if (!currentItem || deleting) return;
    const confirmed = window.confirm('Delete this listing? This cannot be undone.');
    if (!confirmed) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const headers = {};
      if (user?.email) headers['X-User-Email'] = user.email;
      if (ownerPhoneDigits) headers['X-User-Phone'] = ownerPhoneDigits;
      if (trackedOwned && currentItem?.id !== undefined && currentItem?.id !== null) {
        headers['X-Owned-Item-Id'] = String(currentItem.id);
      }
      if (ownedIdList.length > 0) {
        headers['X-My-Items'] = JSON.stringify(ownedIdList);
      }
      await axios.delete(`${API.BASE_URL}/items/${currentItem.id}`, { headers });
      removeStoredId(currentItem.id);
      window.dispatchEvent(new CustomEvent('item-deleted', { detail: { id: currentItem.id } }));
      alert('Item deleted');
      if (onClose) onClose();
    } catch (err) {
      let msg = err?.response?.data?.error || err.message || 'Delete failed';
      if (typeof msg === 'string' && msg.toLowerCase().includes('forbidden')) {
        msg = 'Delete blocked. Provide the original security answer when prompted or sign in using the account that created this item.';
      }
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleEditSuccess = (updated) => {
    if (updated) {
      setItemData(updated);
      window.dispatchEvent(new CustomEvent('item-updated', { detail: updated }));
    }
    setEditOpen(false);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-40 p-6 overflow-auto"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl p-6 w-full max-w-5xl shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-6">
            <div className="w-1/2">
              <div className="bg-gray-100 rounded-lg overflow-hidden h-96 flex items-center justify-center">
                {currentItem?.image_url ? (
                  <img
                    src={currentItem.image_url}
                    alt={currentItem.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400">No image</div>
                )}
              </div>
            </div>
            <div className="w-1/2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-sm">
                    {currentItem?.type || "Lost Item"}
                  </span>

                  <h2 className="text-2xl font-bold mt-4 mb-2">{currentItem?.name}</h2>

                  {currentItem?.category && (
                    <div className="inline-block text-sm text-teal-700 bg-teal-100 px-2 py-1 rounded">
                      {currentItem.category}
                    </div>
                  )}
                </div>

                <button
                  className="text-gray-500"
                  onClick={onClose}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="mt-6 text-gray-700">
                <h4 className="text-sm font-semibold text-gray-600">DESCRIPTION</h4>
                <p className="mt-2">{currentItem?.description || "No description provided."}</p>

                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-600 flex items-center gap-2"><Icons.LocationIcon className="w-4 h-4 text-gray-500"/> Location</h4>
                  <p className="mt-1 flex items-center gap-2"><span className="text-gray-600">{currentItem?.location || "Unknown"}</span></p>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-600 flex items-center gap-2"><Icons.CalendarIcon className="w-4 h-4 text-gray-500"/> Date Reported</h4>
                  <p className="mt-1 flex items-center gap-2"><span className="text-gray-600">{formatDate(currentItem?.date_reported || currentItem?.created_at)}</span></p>
                </div>

                <div className="mt-6 border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-600">CONTACT INFORMATION</h4>
                  <div className="mt-2 bg-teal-50 border border-teal-100 rounded p-3 text-sm text-teal-800">
                    {currentItem?.contact || currentItem?.contact_info || currentItem?.email || "No contact provided"}
                    <div className="text-xs text-gray-500 mt-1">Please reach out if you have any information about this item.</div>
                  </div>
                  <div className="mt-4">
                    <div className="flex gap-3 mt-3">
                      {/* If this is a lost item, allow someone who found it to submit a request (finder flow).
                          Do not show a direct Claim button on lost items. */}
                      {isLost ? (
                        !isOwner && (
                          <>
                            <button
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-sky-500 text-white rounded shadow-lg"
                              onClick={() => setClaimConfirmOpen(true)}
                            >
                              <Icons.ClaimIcon className="w-4 h-4 text-white" />
                              I found this
                            </button>
                            {/* If user is logged in but not owner, allow them to prove ownership using the security answer */}
                            {/* Prove Ownership button removed for simpler finder flow */}
                          </>
                        )
                      ) : (
                        <>
                          <button
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-sky-500 text-white rounded shadow-lg"
                            onClick={() => setClaimConfirmOpen(true)}
                          >
                            <Icons.ClaimIcon className="w-4 h-4 text-white" />
                              Claim Item
                          </button>
                          {/* Prove Ownership button removed for simpler finder flow */}
                        </>
                      )}

                    {canEdit && (
                      <div className="flex flex-wrap gap-3 mt-4">
                        <button
                          className="inline-flex items-center gap-2 px-4 py-2 rounded border border-gray-200 text-gray-700 hover:bg-gray-50"
                          onClick={() => setEditOpen(true)}
                        >
                          Edit Item
                        </button>
                        <button
                          className="inline-flex items-center gap-2 px-4 py-2 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                          onClick={handleDelete}
                          disabled={deleting}
                        >
                          {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    )}
                    {deleteError && (
                      <div className="text-sm text-red-500 mt-2">{deleteError}</div>
                    )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {claimConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setClaimConfirmOpen(false)}>
          <div className="bg-white rounded-lg p-4 w-full max-w-sm shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-medium">{isLost ? 'Are you sure you found the item?' : 'Are you sure you want to claim this item?'}</h3>
            <div className="mt-3 flex justify-end gap-2">
              <button className="px-3 py-2 bg-blue-500 text-white rounded" onClick={() => setClaimConfirmOpen(false)}>No</button>
              <button className="px-3 py-2 bg-red-500 text-white rounded" onClick={() => { setClaimConfirmOpen(false); setClaimOpen(true); }}>Yes</button>
            </div>
          </div>
        </div>
      )}

      {claimOpen && (
        <VerifyModal
          item={currentItem}
          onClose={() => setClaimOpen(false)}
          mode={isLost ? 'finder' : 'claimer'}
          user={user}
        />
      )}

      {ownerClaimOpen && (
        <VerifyModal
          item={currentItem}
          onClose={() => setOwnerClaimOpen(false)}
          mode={'claim-owner'}
          user={user}
        />
      )}
      {editOpen && (
        <EditItemModal
          item={currentItem}
          user={user}
          ownsLocally={trackedOwned}
          ownedIds={ownedIdList}
          onClose={() => setEditOpen(false)}
          onUpdated={handleEditSuccess}
        />
      )}
    </>
  );
}

// Edit/Delete functionality now restored for owners
