import React, { useState } from "react";
import { API } from "../config";

export default function FoundClaimModal({ item, onClose, onSubmitted, user }) {
  const [contact, setContact] = useState(user?.email || "");
  const [name, setName] = useState(user?.name || "");
  const [proofPhoto, setProofPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!proofPhoto) {
      setError("Please upload a proof photo.");
      return;
    }
    const claimantId = (user?.id || user?.email || user?.phone || "").toString().trim().toLowerCase();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("foundItemId", item.id);
      fd.append("claimantContact", contact);
      fd.append("claimantName", name);
      if (claimantId) {
        fd.append("claimantId", claimantId);
      }
      fd.append("proofPhoto", proofPhoto);
      const res = await fetch(API.url('/found-item-claims'), {
        method: 'POST',
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to submit claim');
      if (onSubmitted) onSubmitted(data.claim);
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Claim Found Item</h3>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>
        <div className="mb-4 text-sm text-gray-600">
          Provide your contact info and a quick proof photo so the finder can confirm ownership.
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Your Name</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Email or Phone</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Proof Photo</label>
            <input
              type="file"
              accept="image/*"
              className="mt-1 w-full"
              onChange={(e) => setProofPhoto(e.target.files?.[0] || null)}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="px-4 py-2 border rounded" onClick={onClose}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Proof'}
            </button>
          </div>
        </form>
        {error && <div className="text-sm text-red-600 mt-3">{error}</div>}
      </div>
    </div>
  );
}
