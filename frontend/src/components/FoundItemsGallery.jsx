import React from "react";

export default function FoundItemsGallery({ items = [], loading = false, onClaim, currentUser = null, onEdit, onDelete, deletingId = null, onReviewClaims }) {
  const currentUserId = (currentUser?.id || currentUser?.email || currentUser?.phone || "").toString().trim().toLowerCase();
  const currentUserEmail = (currentUser?.email || "").toString().trim().toLowerCase();
  const currentUserPhone = (currentUser?.phone || "").toString().replace(/\D+/g, "");

  if (loading) {
    return <div className="text-gray-500">Loading unclaimed items…</div>;
  }
  if (!items || items.length === 0) {
    return <div className="text-gray-500">No unclaimed items right now.</div>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items.map((item) => {
        const finderId = (item?.finder_id || "").toString().trim().toLowerCase();
        const finderContact = (item?.finder_contact || "").toString().trim().toLowerCase();
        const finderPhone = (item?.finder_phone || "").toString().replace(/\D+/g, "");
        const isFinderOwner = Boolean(
          (finderId && currentUserId && finderId === currentUserId) ||
          (finderContact && currentUserEmail && finderContact === currentUserEmail) ||
          (finderPhone && currentUserPhone && finderPhone === currentUserPhone)
        );
        const isDeleting = deletingId && String(deletingId) === String(item.id);
        const claims = Array.isArray(item?.found_item_claims) ? item.found_item_claims : [];
        const pendingClaim = isFinderOwner && claims.some((claim) => (claim?.status || 'pending') === 'pending');
        const approvedClaim = isFinderOwner && claims.some((claim) => (claim?.status || '') === 'approved');

        return (
          <div key={item.id} className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="h-48 bg-gray-100">
              {item.image_url ? (
                <img src={item.image_url} alt={item.item_name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">No image</div>
              )}
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h4 className="text-lg font-semibold">{item.item_name}</h4>
              <p className="text-sm text-gray-600 mt-1 flex-1">{item.description || 'No description provided.'}</p>
              <div className="text-xs text-gray-500 mt-2">Found at: {item.location_found || 'Unknown'}</div>
              <div className="text-xs text-gray-500">Date: {item.date_found || 'Unknown'}</div>
              {isFinderOwner && pendingClaim && (
                <div className="mt-3 p-3 border border-yellow-200 bg-yellow-50 rounded-lg text-sm text-yellow-900">
                  Someone claimed this item and is waiting for your approval.
                  {onReviewClaims && (
                    <button
                      type="button"
                      className="ml-2 text-yellow-900 underline font-semibold"
                      onClick={() => onReviewClaims(item)}
                    >
                      Review claim
                    </button>
                  )}
                </div>
              )}
              {isFinderOwner && !pendingClaim && approvedClaim && (
                <div className="mt-3 p-3 border border-green-200 bg-green-50 rounded-lg text-sm text-green-900">
                  Claim approved. Coordinate with the owner to hand over the item.
                </div>
              )}
              {isFinderOwner ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                    type="button"
                    onClick={() => onEdit && onEdit(item)}
                    disabled={!onEdit}
                  >
                    Edit
                  </button>
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded"
                    type="button"
                    onClick={() => onDelete && onDelete(item)}
                    disabled={!onDelete || isDeleting}
                  >
                    {isDeleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              ) : (
                <button
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded"
                  onClick={() => onClaim && onClaim(item)}
                  disabled={!onClaim}
                >
                  This is my item
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
