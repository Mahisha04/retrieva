import React, { useState } from "react";
import ItemDetail from "./ItemDetail";
import { LocationIcon } from "./Icons";

export default function ItemCard({ item, user, ownedIdSet }) {
  const [open, setOpen] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const isLost = ((item?.type || '').toLowerCase() === 'lost');
  const contactInfo = item?.contact || item?.contact_info || item?.email || null;
  const normalize = (value) => (value || '').toString().trim().toLowerCase();
  const normalizeDigits = (value) => (value || '').toString().replace(/\D+/g, '');
  const itemIdKey = item?.id !== undefined && item?.id !== null ? String(item.id) : null;
  const ownedBySet = itemIdKey && ownedIdSet ? ownedIdSet.has(itemIdKey) : false;
  const normalizedContactEmail = normalize(contactInfo);
  const normalizedUserEmail = normalize(user?.email);
  const contactPhoneDigits = normalizeDigits(item?.contact_phone || item?.owner_phone || item?.phone || '');
  const userPhoneDigits = normalizeDigits(user?.phone);
  const matchesContact = normalizedContactEmail && normalizedUserEmail && normalizedContactEmail === normalizedUserEmail;
  const matchesPhone = contactPhoneDigits && userPhoneDigits && contactPhoneDigits === userPhoneDigits;
  const isOwnerView = Boolean(ownedBySet || matchesContact || matchesPhone);
  const showContactCta = isLost && !isOwnerView;

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

          {showContactCta && (
            <div className="mt-4">
              <button
                type="button"
                className="w-full text-sm font-medium px-3 py-2 rounded border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowContact((prev) => !prev);
                }}
              >
                Contact Owner
              </button>
              {showContact && (
                <div className="mt-2 text-sm text-indigo-800 bg-indigo-50 border border-indigo-100 rounded p-3">
                  {contactInfo ? (
                    <>
                      <div>{contactInfo}</div>
                      <p className="text-xs text-gray-500 mt-1">Mention this listing when you reach out.</p>
                    </>
                  ) : (
                    <div>Owner contact not provided.</div>
                  )}
                </div>
              )}
            </div>
          )}
          {isOwnerView && (
            <div className="mt-4 text-xs text-gray-500">You posted this listing.</div>
          )}
        </div>
      </div>

      {open && <ItemDetail item={item} onClose={() => setOpen(false)} user={user} ownedIdSet={ownedIdSet} />}
    </>
  );
}
