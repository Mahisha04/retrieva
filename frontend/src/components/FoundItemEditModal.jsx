import React, { useState } from "react";
import { API } from "../config";

const statusOptions = [
  { value: "unclaimed", label: "Unclaimed" },
  { value: "in-progress", label: "In Progress" },
  { value: "claimed", label: "Claimed" },
];

const getDerivedUserId = (user) => (user?.id || user?.email || user?.phone || "").toString().trim().toLowerCase();
const getDerivedUserPhone = (user) => (user?.phone || "").toString().replace(/\D+/g, "");

export default function FoundItemEditModal({ item, onClose, onUpdated, user }) {
  const [form, setForm] = useState({
    itemName: item?.item_name || "",
    description: item?.description || "",
    locationFound: item?.location_found || "",
    dateFound: item?.date_found ? item.date_found.substring(0, 10) : "",
    finderContact: item?.finder_contact || user?.email || "",
    finderPhone: item?.finder_phone || user?.phone || "",
    status: item?.status || "unclaimed",
  });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!item) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const finderId = getDerivedUserId(user);
    try {
      const fd = new FormData();
      fd.append("itemName", form.itemName);
      fd.append("description", form.description);
      fd.append("locationFound", form.locationFound);
      fd.append("dateFound", form.dateFound);
      fd.append("finderContact", form.finderContact);
      fd.append("finderPhone", form.finderPhone);
      fd.append("status", form.status);
      if (finderId) {
        fd.append("finderId", finderId);
      }
      if (imageFile) {
        fd.append("image", imageFile);
      }

      const headers = {
        "X-User-Id": finderId || "",
        "X-User-Email": user?.email || "",
        "X-User-Phone": getDerivedUserPhone(user) || "",
      };

      const res = await fetch(API.url(`/found-items/${item.id}`), {
        method: "PATCH",
        headers,
        body: fd,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Failed to update found item");
      }
      if (onUpdated) onUpdated(body.item);
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit Found Item</h3>
          <button onClick={onClose} className="text-gray-500" aria-label="Close">
            ✕
          </button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Item Name</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              name="itemName"
              value={form.itemName}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="mt-1 w-full border rounded px-3 py-2"
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Location Found</label>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                name="locationFound"
                value={form.locationFound}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date Found</label>
              <input
                type="date"
                className="mt-1 w-full border rounded px-3 py-2"
                name="dateFound"
                value={form.dateFound}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Finder Contact Email</label>
              <input
                type="email"
                className="mt-1 w-full border rounded px-3 py-2"
                name="finderContact"
                value={form.finderContact}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Finder Phone</label>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                name="finderPhone"
                value={form.finderPhone}
                onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              className="mt-1 w-full border rounded px-3 py-2"
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Replace Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              className="mt-1 w-full"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
            {item?.image_url && (
              <div className="mt-2 text-xs text-gray-500">Current image will remain if you do not upload a new one.</div>
            )}
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex justify-end gap-3">
            <button type="button" className="px-4 py-2 border rounded" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
