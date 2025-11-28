import React, { useState } from "react";
import supabase from "../supabaseClient";

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
    // Use user.id if available, fallback to user.email
    const claimantId = user?.id ? user.id : (user?.email || "").toString().trim().toLowerCase();
    // Prevent finder from claiming their own item
    if (item.finder_id === user.id) {
      alert("You cannot claim your own item.");
      return;
    }
    setSubmitting(true);
    try {
      // Upload photo to Supabase Storage
      const fileExt = proofPhoto.name.split('.').pop();
      const fileName = `${item.id}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(fileName, proofPhoto, { upsert: true });
      if (uploadError) throw new Error(uploadError.message || 'Failed to upload proof photo');
      const { data: urlData } = supabase.storage
        .from('item-images')
        .getPublicUrl(fileName);
      const proofPhotoUrl = urlData?.publicUrl || '';

      const { error } = await supabase.from("found_item_claims").insert({
        found_item_id: item.id, // IMPORTANT
        claimant_id: claimantId, // user.id or user.email
        claimant_name: name,
        claimant_contact: contact,
        proof_photo_url: proofPhotoUrl,
        status: "pending"
      });
      if (error) throw new Error(error.message || "Failed to submit claim");
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setError(err.message || "Submission failed");
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
