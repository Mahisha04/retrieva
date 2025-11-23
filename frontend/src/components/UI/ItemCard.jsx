import React, { useState } from "react";
import ItemDetail from "./ItemDetail";
import { LocationIcon } from "./Icons";

export default function ItemCard({ item, user, ownedIdSet }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-transform transform hover:-translate-y-1 cursor-pointer"
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
      >
        <div className="relative">
          <img
            src={item.image_url || '/placeholder.png'}
            alt={item.name || 'Item image'}
            className="w-full h-56 object-cover"
            onError={(e) => {
              try { e.currentTarget.src = '/placeholder.png'; } catch (err) { /* ignore */ }
            }}
          />
          <div className="absolute top-3 left-3">
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${item.type === 'Lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {item.type || 'Found'}
            </span>
          </div>
        </div>

          <div className="p-4">
          <h3 className="font-semibold text-lg truncate">{item.name}</h3>
          <p className="text-sm text-gray-500 mt-1 truncate">{item.description || item.location || 'No description'}</p>

          <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <LocationIcon className="w-4 h-4 text-gray-400" />
              <span>{item.location || 'Unknown'}</span>
            </div>
            <div>{item.category || 'General'}</div>
          </div>
          <div className="mt-2 text-xs text-gray-350">{new Date(item.created_at || item.createdAt || Date.now()).toLocaleDateString()}</div>
        </div>
      </div>

      {open && <ItemDetail item={item} onClose={() => setOpen(false)} user={user} ownedIdSet={ownedIdSet} />}
    </>
  );
}
