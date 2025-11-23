import React, { useState } from "react";
import axios from "axios";
import { API } from "../../config";

export default function EditItemModal({ item, onClose, onUpdated, user, ownsLocally = false, ownedIds = [] }) {
  const [form, setForm] = useState({
    name: item?.name || "",
    category: item?.category || "",
    description: item?.description || "",
    location: item?.location || "",
    type: (item?.type || "Lost").toLowerCase(),
    contact: item?.contact || user?.email || "",
    security_question: item?.security_question || "",
    security_answer: "",
    security_answer_verify: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const phoneDigits = user?.phone ? user.phone.toString().replace(/\D+/g, "") : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        contact: form.contact.trim(),
        security_question: form.security_question.trim(),
        type: form.type === "found" ? "Found" : "Lost",
      };

      if (!payload.name || !payload.description || !payload.location) {
        setError("Please complete the required fields.");
        setSaving(false);
        return;
      }

      if (form.security_answer.trim()) {
        payload.security_answer = form.security_answer.trim();
      }

      if (form.security_answer_verify.trim()) {
        payload.security_answer_verify = form.security_answer_verify.trim();
      }

      const headers = {};
      if (user?.email) headers["X-User-Email"] = user.email;
      if (phoneDigits) headers["X-User-Phone"] = phoneDigits;

      if (ownsLocally && item?.id !== undefined && item?.id !== null) {
        headers["X-Owned-Item-Id"] = String(item.id);
      }

      if (Array.isArray(ownedIds) && ownedIds.length > 0) {
        headers["X-My-Items"] = JSON.stringify(ownedIds);
      }

      const { data } = await axios.patch(`${API.BASE_URL}/items/${item.id}`, payload, { headers });
      if (onUpdated) onUpdated(data);
    } catch (err) {
      let msg = err?.response?.data?.error || err.message || "Failed to update item.";
      if (typeof msg === "string" && msg.toLowerCase().includes("forbidden")) {
        msg = "Update blocked. Re-enter the original security answer in the verification field or log in with the account that created this item.";
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Edit Item</h3>
          <button className="text-gray-500" onClick={onClose} aria-label="Close edit modal">
            ✕
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-600">Status</label>
              <select
                className="mt-1 w-full border px-3 py-2 rounded"
                value={form.type}
                onChange={handleChange("type")}
              >
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Category</label>
              <input
                className="mt-1 w-full border px-3 py-2 rounded"
                value={form.category}
                onChange={handleChange("category")}
                placeholder="electronics, wallet, documents..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Item Title *</label>
            <input
              className="mt-1 w-full border px-3 py-2 rounded"
              value={form.name}
              onChange={handleChange("name")}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Description *</label>
            <textarea
              className="mt-1 w-full border px-3 py-2 rounded h-28"
              value={form.description}
              onChange={handleChange("description")}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Location *</label>
            <input
              className="mt-1 w-full border px-3 py-2 rounded"
              value={form.location}
              onChange={handleChange("location")}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Preferred Contact</label>
            <input
              className="mt-1 w-full border px-3 py-2 rounded"
              value={form.contact}
              onChange={handleChange("contact")}
              placeholder="owner@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Security Question</label>
            <input
              className="mt-1 w-full border px-3 py-2 rounded"
              value={form.security_question}
              onChange={handleChange("security_question")}
              placeholder="e.g., What color is the strap?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">New Security Answer (optional)</label>
            <input
              className="mt-1 w-full border px-3 py-2 rounded"
              value={form.security_answer}
              onChange={handleChange("security_answer")}
              placeholder="Leave blank to keep current answer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Current Security Answer (for verification)</label>
            <input
              className="mt-1 w-full border px-3 py-2 rounded"
              value={form.security_answer_verify}
              onChange={handleChange("security_answer_verify")}
              placeholder="Enter the answer you originally set"
            />
            <p className="text-xs text-gray-500 mt-1">Needed when your login email/phone no longer matches the original contact.</p>
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="px-4 py-2 rounded border border-gray-200" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
