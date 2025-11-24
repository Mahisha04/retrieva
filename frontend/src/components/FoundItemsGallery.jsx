import React from "react";

export default function FoundItemsGallery({ items = [], loading = false, onClaim }) {
  if (loading) {
    return <div className="text-gray-500">Loading unclaimed items…</div>;
  }
  if (!items || items.length === 0) {
    return <div className="text-gray-500">No unclaimed items right now.</div>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items.map((item) => (
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
            <button
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded"
              onClick={() => onClaim && onClaim(item)}
            >
              This is my item
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
