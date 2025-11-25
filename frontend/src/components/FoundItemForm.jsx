import React, { useState } from "react";
import { API } from "../config";

export default function FoundItemForm({ onSubmitted, user }) {
  const [form, setForm] = useState({
    itemName: "",
    description: "",
    locationFound: "",
    dateFound: "",
    finderContact: user?.email || "",
    finderPhone: user?.phone || "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!imageFile) {
      setMessage({ type: "error", text: "Please upload an image." });
      return;
    }
    const finderId = (user?.id || user?.email || user?.phone || "").toString().trim().toLowerCase();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("itemName", form.itemName);
      fd.append("description", form.description);
      fd.append("locationFound", form.locationFound);
      fd.append("dateFound", form.dateFound);
      fd.append("finderContact", form.finderContact);
      fd.append("finderPhone", form.finderPhone);
      if (finderId) {
        fd.append("finderId", finderId);
      }
      fd.append("image", imageFile);
      const res = await fetch(API.url("/found-items"), {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit found item");
      }
      setMessage({ type: "success", text: "Found item submitted." });
      setForm({
        itemName: "",
        description: "",
        locationFound: "",
        dateFound: "",
        finderContact: user?.email || "",
        finderPhone: user?.phone || "",
      });
      setImageFile(null);
      if (onSubmitted) onSubmitted(data.item);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Submission failed" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          value={form.description}
          onChange={handleChange}
          rows={3}
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
            required
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
            required
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
            required
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
        <label className="block text-sm font-medium text-gray-700">Image Upload</label>
        <input
          type="file"
          accept="image/*"
          className="mt-1 w-full"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          required
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded"
        disabled={submitting}
      >
        {submitting ? "Submitting..." : "Submit Found Item"}
      </button>
      {message && (
        <div
          className={`text-sm mt-2 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}
        >
          {message.text}
        </div>
      )}
    </form>
  );
}
