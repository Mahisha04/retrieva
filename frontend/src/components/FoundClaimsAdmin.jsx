import React from "react";

export default function FoundClaimsAdmin({ claims = [], loading = false, onDecision, onRefresh }) {
  if (loading) {
    return <div className="text-gray-500">Loading claims…</div>;
  }
  if (!claims || claims.length === 0) {
    return (
      <div className="text-gray-500">
        No claims yet. Check again later or refresh.
        {onRefresh && (
          <button className="ml-2 text-blue-600 underline" onClick={onRefresh}>Refresh</button>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {claims.map((claim) => (
        <div key={claim.claim_id || claim.id} className="border rounded-xl bg-white p-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:justify-between gap-3">
            <div>
              <div className="text-xs uppercase text-gray-500">Found Item</div>
              <div className="text-lg font-semibold">{claim.found_item?.item_name || (claim.found_item_id ? `Item #${claim.found_item_id}` : "Unknown Item")}</div>
              <div className="text-sm text-gray-600">{claim.found_item?.description || "No description available."}</div>
              <div className="text-xs text-gray-500 mt-1">Location: {claim.found_item?.location_found || 'Unknown'}</div>
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
            <button
              className="px-4 py-2 bg-green-600 text-white rounded"
              onClick={() => onDecision && onDecision(claim.claim_id || claim.id, 'approve')}
            >
              Approve
            </button>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded"
              onClick={() => onDecision && onDecision(claim.claim_id || claim.id, 'reject')}
            >
              Reject
            </button>
            {onRefresh && (
              <button className="px-4 py-2 border rounded" onClick={onRefresh}>Refresh</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
