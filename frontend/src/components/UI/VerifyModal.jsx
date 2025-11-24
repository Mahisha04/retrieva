import React, { useState } from "react";
import { API } from "../../config";

export default function VerifyModal({ item, onClose, mode = 'claimer', user = null }) {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [formError, setFormError] = useState(null);

  const finderContact = (user && user.email) || 'anonymous';
  const question = item?.security_question || "Security question";
  const helperCopy = {
    finder: "Share a detail that proves you have the item (example: what's engraved on the back?).",
    'claim-owner': "Answer the question you originally set so we know it's your listing.",
    claimer: "Double-check your answer—owners use it to verify you before sharing contact details."
  };
  const submitCopy = mode === 'finder' ? 'Submit Proof' : 'Submit Answer';
  const isFinderMode = mode === 'finder';

  async function submitAnswer(e) {
    e && e.preventDefault();
    setLoading(true);
    setResult(null);
    setFormError(null);
    try {
      if (isFinderMode) {
        if (!proofFile) {
          setFormError('Please upload a proof photo before submitting.');
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append('itemId', item.id);
        formData.append('finderContact', finderContact);
        if (user && user.name) formData.append('finderName', user.name);
        formData.append('finderAnswer', answer);
        formData.append('securityAnswer', answer);
        formData.append('proofPhoto', proofFile);
        const res = await fetch(API.url('/claims'), {
          method: 'POST',
          body: formData,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setResult({ ok: false, error: data.error || 'Failed to create request' });
        } else {
          setProofFile(null);
          setResult({ ok: true, pending: true });
        }
      } else {
        const res = await fetch(API.url('/verify-answer'), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, answer }),
        });
        const data = await res.json().catch(() => ({ ok: false, error: 'Invalid response' }));

        if (!res.ok || !data.ok) {
          setResult({ ok: false, error: data.error || 'Verification failed' });
          return;
        }

        if (mode === 'claim-owner') {
          const payload = { answer };
          const headers = { 'Content-Type': 'application/json' };
          if (user && user.email) headers['X-User-Email'] = user.email;
          const r3 = await fetch(API.url(`/items/${item.id}/claim-ownership`), { method: 'POST', headers, body: JSON.stringify(payload) });
          const j3 = await r3.json().catch(()=>({}));
          if (r3.ok && j3.ok) setResult({ ok: true, claimed: true });
          else setResult({ ok: false, error: j3.error || 'Claim failed' });
        } else {
          setResult({ ok: true });
        }
      }
    } catch (err) {
      setResult({ ok: false, error: err.message || String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{mode === 'finder' ? 'I Found This Item' : (mode === 'claim-owner' ? 'Prove Ownership' : 'Claim Item')}</h3>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>

        <p className="mt-3 text-sm text-gray-700 font-medium">{question}</p>
        <p className="text-xs text-gray-500 mt-1">{helperCopy[mode] || helperCopy.claimer}</p>

        <form onSubmit={submitAnswer} className="mt-4">
          {isFinderMode && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700" htmlFor="proof-photo">Proof Photo Upload</label>
              <input
                id="proof-photo"
                type="file"
                accept="image/*"
                className="mt-2 w-full border rounded px-3 py-2"
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0];
                  setProofFile(file || null);
                }}
                required={false}
              />
              <p className="text-xs text-gray-500 mt-1">Attach a quick photo of the item to help the owner confirm.</p>
            </div>
          )}

          <label className="text-sm font-medium text-gray-700" htmlFor="security-answer">Security Question Answer</label>
          <input
            id="security-answer"
            className="w-full border rounded px-3 py-2"
            placeholder="Enter Answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
          />

          <div className="mt-4 flex items-center gap-3 justify-end">
            <button type="button" className="px-4 py-2 border rounded" onClick={onClose}>Close</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>
              {loading ? "Checking..." : submitCopy}
            </button>
          </div>
        </form>

        {formError && (
          <div className="mt-3 text-sm text-red-600">{formError}</div>
        )}

        {result && (
          <div className={`mt-4 p-3 rounded ${result.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {result.ok
              ? (result.pending ? 'Request sent to the owner for approval.' : 'Answer verified successfully.')
              : `Unable to submit${result.error ? ': ' + result.error : ''}`}

            {result.ok && result.pending && (
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded shadow"
                  onClick={() => {
                    onClose();
                    window.location.hash = '#finder-responses';
                  }}
                >
                  Responses
                </button>
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

