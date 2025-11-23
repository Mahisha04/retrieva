import React, { useState } from "react";
import axios from "axios";
import { API } from "../config";

function AddItem({ onClose, formRef, showButtons = true, user = null, onUploaded = null }) {
  const [status, setStatus] = useState("lost");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [images, setImages] = useState([]);

  const handleFiles = (e) => {
    setImages(Array.from(e.target.files));
  };

  const storageKey = (() => {
    if (!user) return null;
    const email = (user.email || '').toLowerCase().trim();
    if (email) return `myItemIds:${email}`;
    const digits = (user.phone || '').toString().replace(/\D+/g, '');
    return digits ? `myItemIds:phone:${digits}` : null;
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !category || images.length === 0 || !location || !securityQuestion.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    const ownerEmail = (user && user.email) ? user.email.trim() : "";
    const rawPhone = (user && user.phone) ? user.phone.toString() : "";
    const ownerPhoneDigits = rawPhone.replace(/\D+/g, "");
    const preferredContact = ownerEmail || ownerPhoneDigits || "";

    const formData = new FormData();
    formData.append("status", status);
    // also include `type` to match backend / DB field naming
    formData.append("type", status);
    // backend expects `name` field for the item title
    formData.append("name", title);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("location", location);
    formData.append("contact", preferredContact);
    if (ownerPhoneDigits) {
      formData.append("owner_phone", ownerPhoneDigits);
      formData.append("contact_phone", ownerPhoneDigits);
    }
    formData.append("security_question", securityQuestion.trim());
    // send a single file as `image` so the backend multer upload.single('image') receives it
    if (images.length > 0) {
      formData.append("image", images[0]);
    }

    try {
      const headers = { "Content-Type": "multipart/form-data" };
      if (user && user.email) headers['X-User-Email'] = user.email;
      if (ownerPhoneDigits) headers['X-User-Phone'] = ownerPhoneDigits;
      const res = await axios.post(`${API.BASE_URL}/add-item`, formData, { headers });

      alert(res?.data?.message || "Item uploaded successfully!");
      const newItem = res?.data?.item || null;
      try {
        if (newItem && newItem.id !== undefined && newItem.id !== null) {
          if (storageKey) {
            const rawIds = localStorage.getItem(storageKey) || '[]';
            let arrIds;
            try {
              const parsed = JSON.parse(rawIds);
              arrIds = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
              arrIds = [];
            }
            const idKey = String(newItem.id);
            if (!arrIds.includes(idKey)) {
              arrIds.unshift(idKey);
            }
            localStorage.setItem(storageKey, JSON.stringify(arrIds.slice(0, 100)));
            window.dispatchEvent(new CustomEvent('myitems-changed', { detail: { storageKey } }));
          }
        }
      } catch (e) {
        // ignore
      }
      // reset
      setStatus("lost");
      setTitle("");
      setCategory("");
      setDescription("");
      setLocation("");
      setSecurityQuestion("");
      setImages([]);
      if (onClose) onClose();

      // If a parent provided an onUploaded callback, call it instead of reloading
      if (onUploaded && newItem) {
        try {
          onUploaded(newItem);
        } catch (e) {
          console.warn('onUploaded callback failed', e);
        }
      } else {
        // fallback: refresh the page so the new item appears in the list
        setTimeout(() => window.location.reload(), 150);
      }
    } catch (error) {
      const errMsg = error?.response?.data?.error || error.message || "Error uploading item";
      alert(errMsg);
      console.error("Upload error:", error);
    }
  };

  return (
    <div className="add-item">
      <h2 className="text-xl font-semibold mb-4">Submit Lost or Found Item</h2>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm">Item Status *</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full border px-3 py-2 rounded">
            <option value="lost">Lost - I lost this item</option>
            <option value="found">Found - I found this item</option>
          </select>
        </div>

        <div>
          <label className="block text-sm">Item Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Black iPhone 13" className="mt-1 w-full border px-3 py-2 rounded" />
        </div>

        <div>
          <label className="block text-sm">Category *</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full border px-3 py-2 rounded">
            <option value="">Select a category</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="wallet">Wallet/Accessories</option>
            <option value="documents">Documents</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm">Description *</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide detailed description including color, brand, distinctive features..." className="mt-1 w-full border px-3 py-2 rounded" rows={4} />
        </div>

        <div>
          <label className="block text-sm">Location *</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Central Park, near the fountain" className="mt-1 w-full border px-3 py-2 rounded" />
        </div>

        <div>
          <label className="block text-sm">Security Question *</label>
          <input
            type="text"
            value={securityQuestion}
            onChange={(e) => setSecurityQuestion(e.target.value)}
            placeholder="e.g., What engraving is on the inside?"
            className="mt-1 w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm">Upload Images (Max 5) *</label>
          <input type="file" accept="image/*" multiple onChange={handleFiles} className="mt-1" />
          <div className="mt-2 text-sm text-gray-600">{images.length} file(s) selected</div>
        </div>

        {showButtons && (
          <div className="flex justify-end gap-2">
            <button type="button" className="px-3 py-2 bg-gray-200 rounded" onClick={() => (onClose ? onClose() : null)}>Cancel</button>
            <button type="submit" className="px-3 py-2 bg-teal-600 text-white rounded">Upload Item</button>
          </div>
        )}
      </form>
    </div>
  );
}

export default AddItem;
