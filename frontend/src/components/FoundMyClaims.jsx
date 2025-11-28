

import React from "react";
import supabase from "../supabaseClient";

export default function FoundMyClaims({ claims = [], loading = false, isFinder = false, user }) {
  const handleApprove = async (claimId, foundItemId) => {
    if (!claimId || !foundItemId) {
      alert("missing_params");
      return;
    }
    await supabase.from("found_item_claims")
      .update({ status: "approved" })
      .eq("id", claimId);
    await supabase.from("found_items")
      .update({ status: "claimed" })
      .eq("id", foundItemId);
    window.location.reload();
  };

  const handleReject = async (claimId, foundItemId) => {
    if (!claimId || !foundItemId) {
      alert("missing_params");
      return;
    }
    await supabase.from("found_item_claims")
      .update({ status: "rejected" })
      .eq("id", claimId);
    window.location.reload();
  };

  if (loading) {
    return <div className="text-gray-500">Loading your claims…</div>;
  }
  if (!claims || claims.length === 0) {
    return <div className="text-gray-500">No claims yet.</div>;
  }

  // For finder: show incoming claims for their items
  // For lost person: show claims they submitted
  return (
    <div className="space-y-4">
      {claims.map((claim) => (
        <div key={claim.id} className="border rounded-xl bg-white p-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:justify-between gap-3">
            <div>
              <div className="text-xs uppercase text-gray-500">Found Item</div>
              <div className="text-lg font-semibold">{claim.found_item?.item_name || claim.found_item?.name || `Item #${claim.found_item_id}`}</div>
              <div className="text-sm text-gray-600">{claim.found_item?.description}</div>
              <div className="text-xs text-gray-500 mt-1">Location: {claim.found_item?.location_found || claim.found_item?.location || 'Unknown'}</div>
            </div>
            <div className="text-sm text-gray-600">
              <div>Claimant: {claim.claimant_name || 'Unknown'}</div>
              <div>Contact: {claim.claimant_contact}</div>
              <div>Status: {claim.status}</div>
              <div>Submitted: {claim.created_at ? new Date(claim.created_at).toLocaleString() : 'Unknown'}</div>
            </div>
          </div>
          {claim.proof_photo_url && (
            <div className="mt-4">
              <div className="text-xs uppercase text-gray-500 mb-1">Proof Photo</div>
              <img src={claim.proof_photo_url} alt="Proof" className="w-full max-h-72 object-cover rounded" />
            </div>
          )}
          <div className="mt-4 flex gap-3">
            {claim.status === 'pending' && isFinder && (
              <>
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded"
                  onClick={() => handleApprove(claim.id, claim.found_item_id)}
                >
                  Approve
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded"
                  onClick={() => handleReject(claim.id, claim.found_item_id)}
                >
                  Reject
                </button>
              </>
            )}
            {claim.status === 'approved' && (
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded">Approved</span>
            )}
            {claim.status === 'rejected' && (
              <span className="px-4 py-2 bg-red-100 text-red-800 rounded">Rejected</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
