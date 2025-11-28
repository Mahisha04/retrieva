import React from "react";

export default function FoundMyClaims({ claims = [], loading = false }) {
  if (loading) return <div className="text-gray-500">Loading your claims…</div>;
  if (!claims || claims.length === 0) return <div className="text-gray-500">You have not claimed any found items yet.</div>;

  return (
    <div className="space-y-4">
      {claims.map((claim) => {
        const status = claim.status || 'pending';
        const finderPhone = claim.found_item?.finder_phone || claim.found_item?.finder_contact || null;
        const finderContact = claim.found_item?.finder_contact || null;
        return (
          <div key={claim.claim_id || claim.id} className="border rounded-xl bg-white p-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:justify-between gap-3">
              <div>
                <div className="text-xs uppercase text-gray-500">Item</div>
                <div className="text-lg font-semibold">{claim.found_item?.item_name || `Item #${claim.found_item_id}`}</div>
                <div className="text-sm text-gray-600">{claim.found_item?.description}</div>
              </div>
              <div className="text-sm text-gray-600">
                <div>Status: {status}</div>
                {status === 'pending' && (
                  <div className="text-xs text-yellow-600">Waiting for finder approval</div>
                )}
                {status === 'rejected' && (
                  <div className="text-xs text-red-600">Rejected</div>
                )}
                {status === 'approved' && (
                  <div className="text-xs text-green-600">Finder approved your claim</div>
                )}
                <div>Submitted: {claim.created_at ? new Date(claim.created_at).toLocaleString() : 'Unknown'}</div>
              </div>
            </div>
            {claim.proof_photo_url && (
              <div className="mt-3">
                <div className="text-xs uppercase text-gray-500 mb-1">Your Proof</div>
                <img src={claim.proof_photo_url} alt="Proof" className="w-full max-h-60 object-cover rounded" />
              </div>
            )}
            {status === 'approved' && (
              <div className="mt-4 p-3 border border-green-200 rounded bg-green-50 text-gray-900">
                <div className="text-xs uppercase text-gray-500">Contact Finder to Collect Item</div>
                {finderPhone && <div className="text-base font-semibold mt-1">{finderPhone}</div>}
                {finderContact && <div className="text-sm">{finderContact}</div>}
                {!finderPhone && !finderContact && <div className="text-sm">Finder contact unavailable.</div>}
              </div>
            )}
            {status === 'rejected' && (
              <div className="mt-4 text-sm text-red-600 font-medium">Rejected</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
