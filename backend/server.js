// backend/server.js
import express from "express";
import fs from "fs";
import bcrypt from "bcryptjs";
import cors from "cors";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

// JSON parse error handler: return JSON instead of an HTML error page
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    console.log('⚠️ JSON parse error:', err.message);
    return res.status(400).json({ ok: false, error: 'invalid_json', details: err.message });
  }
  next(err);
});

// ---- SUPABASE DETAILS ----
const SUPABASE_URL = "https://fcihpclldwuckzfwohkf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjaWhwY2xsZHd1Y2t6ZndvaGtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEyMjA1MiwiZXhwIjoyMDc4Njk4MDUyfQ.4RimsKdjd-Pq90g3U1fWk2QkP2QC6GRrcZgI8R9MnJc";
const BUCKET_NAME = "item-images";
const FOUND_ITEM_FOLDER = 'found-items';
const FOUND_PROOF_FOLDER = 'found-proofs';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Use memory storage for files
const upload = multer({ storage: multer.memoryStorage() });

// --- Authentication middleware (verify Supabase JWT) ---
async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || req.headers.Authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'missing_authorization' });
    }

    const token = auth.split(' ')[1];

    // Use Supabase to decode/verify the token and fetch the user
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data || !data.user) {
      console.log('⚠️ auth verification failed', error);
      return res.status(401).json({ error: 'invalid_token' });
    }

    req.user = data.user;
    next();
  } catch (e) {
    console.log('⚠️ auth middleware error', e);
    return res.status(500).json({ error: 'auth_error' });
  }
}

async function getSupabaseUserFromRequest(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'missing_authorization' };
  }
  const token = authHeader.split(' ')[1]?.trim();
  if (!token) {
    return { user: null, error: 'missing_authorization' };
  }
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return { user: null, error: error?.message || 'invalid_token' };
    }
    return { user: data.user, error: null };
  } catch (e) {
    return { user: null, error: e.message || 'auth_error' };
  }
}

// --- Require owner middleware ---
async function requireOwner(req, res, next) {
  try {
    const id = req.params.id || req.body.id;
    if (!id) return res.status(400).json({ error: 'missing_id' });

    // Select the full row to avoid errors when optional columns (like `owner`) are absent
    const { data, error } = await supabase.from('items').select('*').eq('id', id).single();
    if (error || !data) return res.status(404).json({ error: 'not_found' });

    // If Authorization present, validate supabase user id matches owner
    const auth = req.headers.authorization || req.headers.Authorization || '';
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.split(' ')[1];
      try {
        const { data: udata, error: uerr } = await supabase.auth.getUser(token);
        if (!uerr && udata && udata.user && data.owner && data.owner === udata.user.id) {
          req.item = data;
          return next();
        }
      } catch (e) {
        // continue to other checks
      }
    }

    const normalizeDigits = (val) => (val ? val.toString().replace(/\D+/g, '') : '');

    // Fallback: dev-friendly header matching against contact email
    const emailHeader = (req.headers['x-user-email'] || req.headers['x_user_email'] || '').toString().toLowerCase();
    const contact = (data.contact || '').toString().toLowerCase();
    if (emailHeader && contact && emailHeader === contact) {
      req.item = data;
      return next();
    }

    // Additional fallback: phone header matching against stored digits
    const phoneHeader = normalizeDigits(req.headers['x-user-phone'] || req.headers['x_user_phone'] || '');
    const storedPhone = normalizeDigits(data.owner_phone || data.contact_phone || data.contact || '');
    if (phoneHeader && storedPhone && phoneHeader === storedPhone) {
      req.item = data;
      return next();
    }

    // Additional dev-friendly path: if caller provided a security_answer in body,
    // verify it against the stored security_answer for this item. If it matches,
    // allow the action (one-off verification) without creating or changing ownership.
    // Support a separate verification field `security_answer_verify` so edit requests
    // can send the current answer for verification while also providing a new
    // `security_answer` to replace it.
    const providedAnswer = (req.body && (req.body.security_answer_verify || req.body.security_answer)) ? String(req.body.security_answer_verify || req.body.security_answer).trim().toLowerCase() : null;
    if (providedAnswer) {
      try {
        const stored = String(data.security_answer || '').toString();
        const looksLikeHash = stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$') || stored.startsWith('$2x$');
        let match = false;
        if (looksLikeHash) {
          match = bcrypt.compareSync(providedAnswer, stored);
        } else {
          match = providedAnswer === (stored || '').toLowerCase().trim();
        }
        if (match) {
          req.item = data;
          return next();
        }
      } catch (e) {
        console.log('⚠️ requireOwner security_answer check error', e);
      }
    }

    const ownedItemHeader = (req.headers['x-owned-item-id'] || req.headers['x_owned_item_id'] || '').toString();
    if (ownedItemHeader && ownedItemHeader === String(id)) {
      req.item = data;
      return next();
    }

    const myItemsHeader = (req.headers['x-my-items'] || req.headers['x_my_items'] || '').toString();
    if (myItemsHeader) {
      try {
        let list = [];
        if (myItemsHeader.trim().startsWith('[')) {
          list = JSON.parse(myItemsHeader);
        } else {
          list = myItemsHeader.split(',');
        }
        const normalized = (Array.isArray(list) ? list : []).map(v => v != null ? v.toString().trim() : '').filter(Boolean);
        if (normalized.includes(String(id))) {
          req.item = data;
          return next();
        }
      } catch (e) {
        // ignore parsing errors
      }
    }

    console.log('⚠️ requireOwner denied', {
      id,
      emailHeader,
      contact,
      phoneHeader,
      storedPhone,
    });

    return res.status(403).json({ error: 'forbidden' });
  } catch (e) {
    console.log('⚠️ requireOwner error', e);
    return res.status(500).json({ error: 'owner_check_failed' });
  }
}

function normalizeIdentifier(value) {
  if (value === undefined || value === null) return '';
  return value.toString().trim().toLowerCase();
}

function normalizeDigitsValue(value) {
  if (!value) return '';
  return value.toString().replace(/\D+/g, '');
}

function extractStoragePathFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const marker = `${BUCKET_NAME}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

async function deleteStorageAssetByUrl(url) {
  const path = extractStoragePathFromUrl(url);
  if (!path) return;
  try {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
    if (error) {
      console.log('⚠️ failed to delete storage asset', { url, error });
    }
  } catch (e) {
    console.log('⚠️ deleteStorageAssetByUrl exception', e);
  }
}

async function requireFinderOwner(req, res, next) {
  try {
    const id = (req.params.id || req.body.id || '').toString().trim();
    if (!id) return res.status(400).json({ error: 'missing_id' });

    const { data, error } = await supabase.from('found_items').select('*').eq('id', id).single();
    if (error || !data) return res.status(404).json({ error: 'not_found' });

    const headerId = normalizeIdentifier(req.headers['x-user-id'] || req.headers['x_user_id']);
    const headerEmail = normalizeIdentifier(req.headers['x-user-email'] || req.headers['x_user_email']);
    const headerPhone = normalizeDigitsValue(req.headers['x-user-phone'] || req.headers['x_user_phone']);

    const rowFinderId = normalizeIdentifier(data.finder_id);
    const rowFinderContact = normalizeIdentifier(data.finder_contact);
    const rowFinderPhone = normalizeDigitsValue(data.finder_phone);

    const matchesId = rowFinderId && headerId && rowFinderId === headerId;
    const matchesContact = rowFinderContact && headerEmail && rowFinderContact === headerEmail;
    const matchesPhone = rowFinderPhone && headerPhone && rowFinderPhone === headerPhone;

    if (matchesId || matchesContact || matchesPhone) {
      req.foundItem = data;
      return next();
    }

    console.log('⚠️ requireFinderOwner denied', {
      id,
      headerId,
      headerEmail,
      headerPhone,
      rowFinderId,
      rowFinderContact,
      rowFinderPhone,
    });
    return res.status(403).json({ error: 'forbidden' });
  } catch (e) {
    console.log('⚠️ requireFinderOwner error', e);
    return res.status(500).json({ error: 'owner_check_failed' });
  }
}

// ------------------ TEST ROUTE ------------------
app.get("/test", (req, res) => {
  res.send("Backend is working!");
});

// --- Simple claims persistence (file-backed) and email notifier ---
const CLAIMS_FILE = 'claims.json';
function readClaims() {
  try {
    if (!fs.existsSync(CLAIMS_FILE)) return [];
    const raw = fs.readFileSync(CLAIMS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.log('⚠️ readClaims error', e);
    return [];
  }
}
function writeClaims(arr) {
  try {
    fs.writeFileSync(CLAIMS_FILE, JSON.stringify(arr, null, 2));
    return true;
  } catch (e) {
    console.log('⚠️ writeClaims error', e);
    return false;
  }
}

function normalizeContactPhone(val) {
  if (!val) return null;
  const digits = val.toString().replace(/\D+/g, '');
  return digits || null;
}

async function sendEmail({ to, subject, text, html }) {
  // Email feature disabled in dev — log the notification and return success
  try {
    console.log('📧 [EMAIL DISABLED] to=', to, 'subject=', subject, 'text=', text);
    return { ok: true, info: 'logged' };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ------------------ ADD ITEM ------------------
// Public item creation: allow anyone to upload items (dev mode).
// Note: this removes the requirement for a Supabase JWT; owner remains optional.
app.post("/add-item", upload.single("image"), async (req, res) => {
  try {
    console.log("🔥 Upload received");
    console.log("Body:", req.body);
    console.log("File:", req.file);

    if (!req.file) {
      return res.status(400).json({ error: "No file selected" });
    }

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const fileBuffer = req.file.buffer;

    // Upload to Supabase
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBuffer, {
        contentType: req.file.mimetype,
      });

    if (uploadErr) {
      console.log("❌ Upload error:", uploadErr);
      return res.status(500).json({ error: "Upload failed" });
    }

    // Public image URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    // Build a candidate row from request body, normalizing where appropriate
    const rawType = (req.body.type || req.body.status || "").toString().toLowerCase();
    let normalizedType = null;
    if (rawType === "lost" || rawType === "l") normalizedType = "Lost";
    if (rawType === "found" || rawType === "f") normalizedType = "Found";

    // Normalize and hash the security answer for consistent verification
    const rawAnswer = (req.body.security_answer || "").toString().trim();
    const normalizedAnswer = rawAnswer === "" ? null : rawAnswer.toLowerCase();

    // If the request includes a dev-friendly X-User-Email header and there is no
    // authenticated req.user, prefer that value for contact so owner checks work
    // in development without full Supabase auth.
    const devEmailHeader = (req.headers['x-user-email'] || req.headers['x_user_email'] || '').toString().trim();

    const rawOwnerPhone = (req.body.owner_phone || req.body.contact_phone || '').toString();
    const ownerPhoneDigits = rawOwnerPhone.replace(/\D+/g, '') || null;

    const candidateRow = {
      name: req.body.name,
      image_url: imageUrl,
      type: normalizedType,
      category: req.body.category || null,
      description: req.body.description || null,
      location: req.body.location || null,
      // prefer contact from request body, but fall back to X-User-Email header when present
      contact: req.body.contact || (devEmailHeader || null),
      contact_phone: ownerPhoneDigits,
      owner_phone: ownerPhoneDigits,
      security_question: req.body.security_question || null,
      security_answer: normalizedAnswer ? bcrypt.hashSync(normalizedAnswer, 10) : null,
      // Persist the owner (user id) when present. If the `owner` column doesn't exist
      // the progressive insert fallback will drop unknown columns.
      owner: req.user?.id || null,
    };

    // Inspect the existing table schema (by fetching one row) to determine which columns exist
    let allowedKeys = ["name", "image_url", "category", "description", "location"];
    try {
      const sample = await supabase.from("items").select().limit(1);
      if (sample && sample.data && sample.data.length > 0) {
        allowedKeys = Object.keys(sample.data[0]);
      }
    } catch (e) {
      console.log("⚠️ Could not inspect items schema, falling back to defaults", e);
    }
    

    // Build the final insert row by keeping only allowed columns
    const itemRow = {};
    for (const k of allowedKeys) {
      if (candidateRow[k] !== undefined) {
        itemRow[k] = candidateRow[k];
      }
    }

    // Insert and return the created row so frontend can confirm
    // Try inserting the full row first. If DB rejects (e.g. missing columns),
    // retry with a reduced payload excluding optional security fields.
    let inserted = null;
    let dbErr = null;

    try {
      const insertRes = await supabase.from("items").insert([itemRow]).select().single();
      inserted = insertRes.data;
      dbErr = insertRes.error;
    } catch (e) {
      dbErr = e;
    }

    if (dbErr) {
      console.log("❌ Database error on full insert:", dbErr);

      // Prepare progressive fallbacks: remove optional fields gradually
      const attempts = [
        {
          name: "no-security",
          row: {
            name: itemRow.name,
            image_url: itemRow.image_url,
            type: itemRow.type,
            category: itemRow.category,
            description: itemRow.description,
            location: itemRow.location,
            contact: itemRow.contact,
          },
        },
        {
          name: "no-security-no-contact",
          row: {
            name: itemRow.name,
            image_url: itemRow.image_url,
            type: itemRow.type,
            category: itemRow.category,
            description: itemRow.description,
            location: itemRow.location,
          },
        },
        {
          name: "minimal",
          row: {
            name: itemRow.name,
            image_url: itemRow.image_url,
            type: itemRow.type,
          },
        },
      ];

      for (const attempt of attempts) {
        try {
          console.log(`🔁 Trying insert attempt: ${attempt.name}`);
          const retryRes = await supabase.from("items").insert([attempt.row]).select().single();
          inserted = retryRes.data;
          dbErr = retryRes.error;
          if (!dbErr) {
            console.log(`✅ Insert succeeded on attempt '${attempt.name}' id:`, inserted?.id);
            break;
          }
        } catch (e) {
          dbErr = e;
        }
      }
    }

    if (dbErr) {
      console.log("❌ Database insert ultimately failed:", dbErr);
      // Make sure we return a serializable error detail
      let detail = null;
      try {
        if (!dbErr) detail = null;
        else if (typeof dbErr === "string") detail = dbErr;
        else if (dbErr.message) detail = dbErr.message;
        else detail = JSON.stringify(dbErr);
      } catch (e) {
        detail = String(dbErr);
      }

      // Append the detailed error to a log file for inspection
      try {
        const time = new Date().toISOString();
        fs.appendFileSync(
          "db-error.log",
          `${time} - Database insert failed: ${detail}\n`
        );
      } catch (e) {
        console.log("⚠️ Failed to write db-error.log:", e);
      }

      return res.status(500).json({ error: "Database insert failed", details: detail });
    }

    // Return the inserted row to the frontend for immediate confirmation
    res.json({ message: "Item added", item: inserted });
  } catch (err) {
    console.log("❌ Unexpected error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ------------------ CLAIMS: create a persistent claim request ------------------
// POST /claims with multipart payload (finder answer + proof photo)
app.post('/claims', upload.single('proofPhoto'), async (req, res) => {
  try {
    const body = req.body || {};
    const itemId = Number(body.itemId || body.item_id);
    const finderContact = body.finderContact || body.finder_contact || null;
    const finderName = body.finderName || body.finder_name || null;
    if (!itemId) return res.status(400).json({ error: 'missing_itemId' });

    const proofFile = req.file || null;
    if (!proofFile) {
      return res.status(400).json({ error: 'missing_proof_photo' });
    }

    const rawAnswerSource =
      body?.finderAnswer ??
      body?.finder_answer ??
      body?.securityAnswer ??
      body?.security_answer ??
      body?.answer ??
      body?.answer_text ??
      body?.response ??
      '';
    const finderAnswerClean = rawAnswerSource === null || rawAnswerSource === undefined
      ? ''
      : rawAnswerSource.toString();
    const trimmedFinderAnswer = finderAnswerClean.trim();

    // verify item exists
    const { data: item, error: itemErr } = await supabase.from('items').select('*').eq('id', itemId).single();
    if (itemErr || !item) return res.status(404).json({ error: 'item_not_found' });

    const normalizedFinderAnswer = trimmedFinderAnswer.toLowerCase();
    let answerIsCorrect = null;
    if (normalizedFinderAnswer && item.security_answer) {
      try {
        const stored = String(item.security_answer || '');
        const looksLikeHash = stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$') || stored.startsWith('$2x$');
        if (looksLikeHash) {
          answerIsCorrect = bcrypt.compareSync(normalizedFinderAnswer, stored);
        } else {
          answerIsCorrect = normalizedFinderAnswer === stored.toLowerCase().trim();
        }
      } catch (e) {
        answerIsCorrect = false;
      }
    }

    // Upload proof photo to Supabase storage
    let proofPhotoUrl = null;
    let proofStoragePath = null;
    if (proofFile && proofFile.buffer) {
      const safeName = (proofFile.originalname || 'proof.jpg').replace(/[^a-zA-Z0-9.\-_]/g, '_');
      proofStoragePath = `proofs/${Date.now()}-${safeName}`;
      const { error: proofErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(proofStoragePath, proofFile.buffer, {
          contentType: proofFile.mimetype || 'image/jpeg',
          upsert: false,
        });
      if (proofErr) {
        console.log('⚠️ proof upload error', proofErr);
        return res.status(500).json({ error: 'proof_upload_failed' });
      }
      const { data: proofUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(proofStoragePath);
      proofPhotoUrl = proofUrlData?.publicUrl || null;
    }

    const claims = readClaims();
    const id = Date.now();
    const ownerContactRaw = item.contact || null;
    const ownerPhoneCandidate = item.owner_phone || item.contact_phone || null;
    const ownerContactDisplay = ownerContactRaw || ownerPhoneCandidate || null;
    const claim = {
      id,
      itemId: itemId,
      itemName: item.name || null,
      ownerEmail: ownerContactRaw,
      ownerPhone: normalizeContactPhone(ownerContactRaw) || ownerPhoneCandidate,
      ownerContactLabel: ownerContactDisplay,
      finderContact: finderContact || null,
      finderName: finderName || null,
      finderAnswer: trimmedFinderAnswer || finderAnswerClean || null,
      answerIsCorrect,
      answerCheckedAt: normalizedFinderAnswer ? new Date().toISOString() : null,
      securityQuestion: item.security_question || null,
      status: 'pending',
      proofPhotoUrl: proofPhotoUrl,
      proofStoragePath,
      proofUploadedAt: proofPhotoUrl ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
    };
    claims.push(claim);
    writeClaims(claims);

    // Notify owner by email if contact exists
    if (claim.ownerEmail) {
      const subject = `Finder request for your item: ${claim.itemName || itemId}`;
      const text = `A user (${claim.finderContact || 'unknown'}) claims to have found your item '${claim.itemName}'. Please review their request in the app.`;
      sendEmail({ to: claim.ownerEmail, subject, text }).catch(e => console.log('notify owner error', e));
    }

    res.json({ ok: true, claim });
  } catch (e) {
    console.log('⚠️ create claim error', e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

// ------------------ FOUND ITEMS WORKFLOW ------------------

function safeFileName(original = 'upload.jpg', prefix = '') {
  const cleaned = original.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${prefix}${Date.now()}-${cleaned}`;
}

async function uploadBufferToStorage(path, buffer, mimeType = 'application/octet-stream', { upsert = false } = {}) {
  const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, buffer, {
    contentType: mimeType,
    upsert,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data?.publicUrl || null;
}

// POST /found-items
app.post('/found-items', upload.single('image'), async (req, res) => {
  try {
    const authResult = await getSupabaseUserFromRequest(req);
    if (authResult.error || !authResult.user?.id) {
      return res.status(401).json({ error: 'auth_required', details: authResult.error || null });
    }

    const { itemName, description, locationFound, dateFound, finderContact, finderPhone } = req.body || {};
    const normalizedFinderPhone = finderPhone ? finderPhone.toString().replace(/\D+/g, '') : null;
    if (!itemName) return res.status(400).json({ error: 'missing_item_name' });
    if (!req.file) return res.status(400).json({ error: 'missing_image' });

    const storagePath = `${FOUND_ITEM_FOLDER}/${safeFileName(req.file.originalname)}`;
    const imageUrl = await uploadBufferToStorage(storagePath, req.file.buffer, req.file.mimetype || 'image/jpeg');

    const payload = {
      item_name: itemName,
      description: description || null,
      finder_contact: finderContact || authResult.user.email || null,
      finder_phone: normalizedFinderPhone,
      location_found: locationFound || null,
      date_found: dateFound || null,
      image_url: imageUrl,
      finder_id: authResult.user.id,
      status: 'unclaimed',
    };

    const { data, error } = await supabase.from('found_items').insert([payload]).select().single();
    if (error) throw error;
    res.json({ ok: true, item: data });
  } catch (e) {
    console.log('⚠️ found item create error', e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

// GET /found-items?status=unclaimed&finderContact=email&includeClaims=true
app.get('/found-items', async (req, res) => {
  try {
    const status = (req.query.status || '').toString().toLowerCase();
    const finderContact = (req.query.finderContact || '').toString().toLowerCase();
    const finderPhoneRaw = (req.query.finderPhone || '').toString();
    const finderIdFilter = normalizeIdentifier(req.query.finderId || '');
    const includeClaims = req.query.includeClaims === 'true';
    const normalizePhone = (val) => (val ? val.replace(/\D+/g, '') : '');

    let query = supabase
      .from('found_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (finderContact) {
      query = query.ilike('finder_contact', finderContact);
    }
    const finderPhone = normalizePhone(finderPhoneRaw);
    if (finderPhone) {
      query = query.eq('finder_phone', finderPhone);
    }
    if (finderIdFilter) {
      query = query.eq('finder_id', finderIdFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

    let rows = data || [];
    if (includeClaims && Array.isArray(rows) && rows.length > 0) {
      const itemIds = rows
        .map((entry) => (entry && entry.id !== undefined && entry.id !== null ? Number(entry.id) : null))
        .filter((id) => id);
      if (itemIds.length > 0) {
        try {
          const { data: claimRows, error: claimErr } = await supabase
            .from('found_item_claims')
            .select('*')
            .in('found_item_id', itemIds);
          if (claimErr) throw claimErr;
          const grouped = new Map();
          (claimRows || []).forEach((claim) => {
            const fid = claim && claim.found_item_id !== undefined && claim.found_item_id !== null
              ? Number(claim.found_item_id)
              : null;
            if (!fid) return;
            if (!grouped.has(fid)) grouped.set(fid, []);
            grouped.get(fid).push(claim);
          });
          rows = rows.map((entry) => {
            const entryId = entry && entry.id !== undefined && entry.id !== null ? Number(entry.id) : null;
            return {
              ...entry,
              found_item_claims: entryId && grouped.get(entryId) ? grouped.get(entryId) : [],
            };
          });
        } catch (claimsErr) {
          console.log('⚠️ failed to attach found item claims', claimsErr);
        }
      }
    }

    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

// POST /found-item-claims
app.post('/found-item-claims', upload.single('proofPhoto'), async (req, res) => {
  try {
    const { foundItemId, claimantContact, claimantName } = req.body || {};
    const claimantIdRaw = (req.body?.claimantId || req.body?.claimant_id || '').toString();
    const claimantId = normalizeIdentifier(claimantIdRaw);
    if (!foundItemId) return res.status(400).json({ error: 'missing_found_item_id' });
    if (!claimantContact) return res.status(400).json({ error: 'missing_contact' });
    if (!req.file) return res.status(400).json({ error: 'missing_proof_photo' });

    const proofPath = `${FOUND_PROOF_FOLDER}/${safeFileName(req.file.originalname, `${foundItemId}-`)}`;
    const proofUrl = await uploadBufferToStorage(proofPath, req.file.buffer, req.file.mimetype || 'image/jpeg');

    const payload = {
      found_item_id: Number(foundItemId),
      claimant_contact: claimantContact,
      claimant_name: claimantName || null,
      proof_photo_url: proofUrl,
      status: 'pending',
      claimant_id: claimantId || null,
    };

    const { data, error } = await supabase.from('found_item_claims').insert([payload]).select().single();
    if (error) throw error;
    res.json({ ok: true, claim: data });
  } catch (e) {
    console.log('⚠️ found item claim error', e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

// Helper to attach found item info to claims
async function attachFoundItemsToClaims(claims) {
  if (!Array.isArray(claims) || claims.length === 0) return [];
  const ids = [...new Set(claims.map((c) => c.found_item_id).filter(Boolean))];
  if (ids.length === 0) return claims;
  try {
    const { data, error } = await supabase.from('found_items').select('*').in('id', ids);
    if (error) throw error;
    const map = new Map((data || []).map((item) => [item.id, item]));
    return claims.map((claim) => ({ ...claim, found_item: map.get(claim.found_item_id) || null }));
  } catch (e) {
    console.log('⚠️ attach found items error', e);
    return claims;
  }
}

// GET /found-item-claims
app.get('/found-item-claims', async (req, res) => {
  try {
    const claimantContact = (req.query.claimantContact || '').toString().toLowerCase();
    const claimantId = normalizeIdentifier(req.query.claimantId || '');
    const admin = req.query.admin === 'true';
    const finderContact = (req.query.finderContact || '').toString().toLowerCase();
    const finderPhoneRaw = (req.query.finderPhone || '').toString();
    const finderIdFilter = normalizeIdentifier(req.query.finderId || '');
    const normalizePhone = (val) => (val ? val.toString().replace(/\D+/g, '') : '');
    const finderPhone = normalizePhone(finderPhoneRaw);
    const collectIds = (input) => {
      if (!input) return [];
      if (Array.isArray(input)) {
        return input.flatMap((entry) => collectIds(entry));
      }
      return String(input)
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    };

    const providedFoundItemIds = collectIds(req.query.foundItemIds || req.query.foundItemId || []);
    let finderItemIds = [];
    if (finderContact || finderPhone || finderIdFilter) {
      const finderQuery = supabase.from('found_items').select('id');
      if (finderContact) finderQuery.ilike('finder_contact', finderContact);
      if (finderPhone) finderQuery.eq('finder_phone', finderPhone);
      if (finderIdFilter) finderQuery.eq('finder_id', finderIdFilter);
      const { data: finderItems, error: finderErr } = await finderQuery;
      if (finderErr) throw finderErr;
      finderItemIds = (finderItems || [])
        .map((item) => (item && item.id !== undefined && item.id !== null ? Number(item.id) : null))
        .filter((id) => id);
      if (finderItemIds.length === 0) {
        return res.json([]);
      }
    }

    const foundItemIdsFilter = Array.from(new Set([
      ...providedFoundItemIds.map((id) => Number(id)).filter((id) => id),
      ...finderItemIds,
    ]));

    let query = supabase.from('found_item_claims').select('*').order('created_at', { ascending: false });
    if (claimantContact) {
      query = query.ilike('claimant_contact', claimantContact);
    }
    if (claimantId) {
      query = query.eq('claimant_id', claimantId);
    }
    if (foundItemIdsFilter.length > 0) {
      query = query.in('found_item_id', foundItemIdsFilter);
    }
    const hasFinderFilter = finderContact || finderPhone || finderIdFilter || foundItemIdsFilter.length > 0;
    if (!admin && !claimantContact && !claimantId && !hasFinderFilter) {
      return res.json([]);
    }

    const { data, error } = await query;
    if (error) throw error;
    const enriched = await attachFoundItemsToClaims(data || []);
    res.json(enriched);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

// PATCH /found-item-claims/:id
app.patch('/found-item-claims/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const action = req.body?.action;
    if (!id || !action) return res.status(400).json({ error: 'missing_params' });

    const status = action === 'approve' ? 'approved' : 'rejected';
    const { data, error } = await supabase
      .from('found_item_claims')
      .update({ status, acted_at: new Date().toISOString() })
      .eq('claim_id', id)
      .select()
      .single();
    if (error) throw error;

    if (data?.found_item_id) {
      try {
        if (status === 'approved') {
          await supabase
            .from('found_items')
            .update({ status: 'claimed' })
            .eq('id', data.found_item_id);
        } else if (status === 'rejected') {
          await supabase
            .from('found_items')
            .update({ status: 'unclaimed' })
            .eq('id', data.found_item_id);
        }
      } catch (e) {
        console.log('⚠️ failed to update found item status after claim decision', e);
      }
    }

    res.json({ ok: true, claim: data });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

// PATCH /found-items/:id (finder-managed updates)
app.patch('/found-items/:id', requireFinderOwner, upload.single('image'), async (req, res) => {
  try {
    const idParam = (req.params.id ?? '').toString().trim();
    if (!idParam) return res.status(400).json({ error: 'invalid_id' });

    const updates = {};
    const map = {
      itemName: 'item_name',
      description: 'description',
      locationFound: 'location_found',
      dateFound: 'date_found',
      status: 'status',
      finderContact: 'finder_contact',
      finderId: 'finder_id',
    };

    for (const [bodyKey, column] of Object.entries(map)) {
      if (req.body?.[bodyKey] !== undefined) {
        let value = req.body[bodyKey];
        if (column === 'finder_id') {
          value = normalizeIdentifier(value);
        }
        updates[column] = value === '' ? null : value;
      }
    }

    if (req.body?.finderPhone !== undefined) {
      const digits = req.body.finderPhone ? req.body.finderPhone.toString().replace(/\D+/g, '') : '';
      updates.finder_phone = digits || null;
    }

    if (req.file) {
      const storagePath = `${FOUND_ITEM_FOLDER}/${safeFileName(req.file.originalname, `${idParam}-edit-`)}`;
      const newUrl = await uploadBufferToStorage(storagePath, req.file.buffer, req.file.mimetype || 'image/jpeg');
      updates.image_url = newUrl;
      if (req.foundItem?.image_url) {
        deleteStorageAssetByUrl(req.foundItem.image_url).catch(() => {});
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'no_updates' });
    }

    const { data, error } = await supabase
      .from('found_items')
      .update(updates)
      .eq('id', idParam)
      .select()
      .single();
    if (error) throw error;

    res.json({ ok: true, item: data });
  } catch (e) {
    console.log('⚠️ found item update error', e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

// DELETE /found-items/:id
app.delete('/found-items/:id', requireFinderOwner, async (req, res) => {
  try {
    const idParam = (req.params.id ?? '').toString().trim();
    if (!idParam) return res.status(400).json({ error: 'invalid_id' });

    if (req.foundItem?.image_url) {
      await deleteStorageAssetByUrl(req.foundItem.image_url);
    }

    try {
      await supabase.from('found_item_claims').delete().eq('found_item_id', idParam);
    } catch (e) {
      console.log('⚠️ failed to delete found item claims for', id, e);
    }

    const { error } = await supabase.from('found_items').delete().eq('id', idParam);
    if (error) throw error;

    res.json({ ok: true });
  } catch (e) {
    console.log('⚠️ found item delete error', e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

// GET /claims?ownerEmail=owner@example.com
app.get('/claims', async (req, res) => {
  try {
    const ownerEmail = (req.query.ownerEmail || '').toString().toLowerCase();
    const ownerPhoneRaw = (req.query.ownerPhone || '').toString();
    const finderContact = (req.query.finderContact || '').toString().toLowerCase();
    const normalizePhone = (val) => val ? val.toString().replace(/\D+/g, '') : '';
    const collectItemIds = (input) => {
      if (!input) return [];
      if (Array.isArray(input)) {
        return input.flatMap((val) => collectItemIds(val));
      }
      return String(input)
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    };
    const requestedItemIds = collectItemIds(req.query.itemIds || null);
    const ownerPhone = normalizePhone(ownerPhoneRaw);
    const claims = readClaims();
    let filtered = claims;

    const requestedSet = new Set(requestedItemIds.map((id) => id.toString()));
    const contactFilterActive = Boolean(ownerEmail || ownerPhone);
    const itemFilterActive = requestedSet.size > 0;

    filtered = filtered.filter((c) => {
      const emailMatch = ownerEmail && ((c.ownerEmail || '').toString().toLowerCase() === ownerEmail);
      const phoneMatch = ownerPhone && normalizePhone(c.ownerPhone || '') === ownerPhone;
      const matchesContact = emailMatch || phoneMatch;
      const matchesItem = itemFilterActive && requestedSet.has((c.itemId ?? '').toString());
      const finderMatch = finderContact ? ((c.finderContact || '').toString().toLowerCase() === finderContact) : true;

      if (!finderMatch) return false;

      if (contactFilterActive && itemFilterActive) {
        return matchesContact || matchesItem;
      }
      if (contactFilterActive) {
        return matchesContact;
      }
      if (itemFilterActive) {
        return matchesItem;
      }
      return true;
    });

    res.json(filtered);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /claims/:id body { action: 'approve'|'reject' }
app.patch('/claims/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const action = req.body.action;
    if (!id || !action) return res.status(400).json({ error: 'missing_params' });

    const claims = readClaims();
    const idx = claims.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'not_found' });

    claims[idx].status = action === 'approve' ? 'approved' : 'rejected';
    claims[idx].actedAt = new Date().toISOString();
    if (req.body && req.body.ownerPhone) {
      claims[idx].ownerPhone = req.body.ownerPhone;
    }
    writeClaims(claims);

    // If approved, mark item as Returned in DB (if type column exists)
    if (action === 'approve') {
      const itemId = claims[idx].itemId;
      try {
        await supabase.from('items').update({ type: 'Returned' }).eq('id', itemId);
      } catch (e) {
        console.log('⚠️ failed to mark item returned', e);
      }

      // Notify finder (if finderContact looks like an email)
      const to = claims[idx].finderContact;
      if (to && to.includes('@')) {
        const subject = `Your request for '${claims[idx].itemName}' was approved`;
        const text = `The owner approved your request. Please coordinate directly: ${to}`;
        sendEmail({ to, subject, text }).catch(e => console.log('notify finder error', e));
      }
    }

    res.json({ ok: true, claim: claims[idx] });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

// ------------------ GET ITEMS ------------------
app.get("/items", async (req, res) => {
  try {
    const { data, error } = await supabase.from("items").select("*");

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("items error:", err);
    res.json([]);
  }
});

// ------------------ VERIFY SECURITY ANSWER ------------------
// POST /verify-answer
// body: { id: <item id>, answer: <plaintext answer> }
app.post("/verify-answer", async (req, res) => {
  try {
    // Debug: log incoming verify payload for troubleshooting
    try { console.log('🔍 /verify-answer payload:', { body: req.body }); } catch (e) { console.log('🔍 failed to log payload', e); }
    const { id, answer } = req.body;
    if (!id || !answer) return res.status(400).json({ ok: false, error: "missing id or answer" });

    const { data, error } = await supabase.from("items").select("security_answer").eq("id", id).single();
    if (error) {
      console.log("❌ verify fetch error:", error);
      return res.status(500).json({ ok: false, error: error.message || String(error) });
    }

    if (!data || !data.security_answer) {
      return res.json({ ok: true, warning: 'no_security_configured' });
    }

    // Normalize incoming answer for comparison
    const incoming = String(answer || "").toString().trim().toLowerCase();

    const stored = String(data.security_answer || "").toString();

    // Detect if stored value looks like a bcrypt hash (starts with $2a$/$2b$/$2y$)
    const looksLikeHash = stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$") || stored.startsWith("$2x$");

    let isMatch = false;
    try {
      if (looksLikeHash) {
        // Compare normalized plaintext against the stored bcrypt hash
        isMatch = bcrypt.compareSync(incoming, stored);
      } else {
        // Legacy plaintext stored in DB: do a trimmed, case-insensitive comparison
        const storedNorm = stored.toLowerCase().trim();
        isMatch = incoming === storedNorm;
      }
    } catch (e) {
      console.log('⚠️ verify compare error', e);
      isMatch = false;
    }

    // Append debug info to a log file so we can inspect incoming verify attempts
    try {
      const dbg = {
        time: new Date().toISOString(),
        id: id,
        incoming: incoming,
        looksLikeHash: !!looksLikeHash,
        matched: !!isMatch,
      };
      fs.appendFileSync('verify-debug.log', JSON.stringify(dbg) + '\n');
    } catch (e) {
      console.log('⚠️ failed to write verify-debug.log', e);
    }

    return res.json({ ok: !!isMatch });
  } catch (err) {
    console.log("❌ verify unexpected error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ------------------ CLAIM OWNERSHIP (dev-friendly) ------------------
// POST /items/:id/claim-ownership  { answer: '<plaintext>' }
// Headers: X-User-Email: owner@example.com
app.post('/items/:id/claim-ownership', async (req, res) => {
  try {
    const id = req.params.id;
    const answer = (req.body && req.body.answer) ? String(req.body.answer) : '';
    const requesterEmail = (req.headers['x-user-email'] || req.headers['x_user_email'] || '').toString().trim().toLowerCase();

    if (!id || !answer) return res.status(400).json({ ok: false, error: 'missing_id_or_answer' });
    if (!requesterEmail) return res.status(400).json({ ok: false, error: 'missing_user_email_header' });

    // fetch stored security answer
    const { data, error } = await supabase.from('items').select('security_answer,contact').eq('id', id).single();
    if (error || !data) return res.status(404).json({ ok: false, error: 'item_not_found' });

    if (!data.security_answer) return res.status(400).json({ ok: false, error: 'no_security' });

    const incoming = String(answer || '').trim().toLowerCase();
    const stored = String(data.security_answer || '');
    const looksLikeHash = stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$') || stored.startsWith('$2x$');
    let isMatch = false;
    try {
      if (looksLikeHash) isMatch = bcrypt.compareSync(incoming, stored);
      else isMatch = incoming === stored.toLowerCase().trim();
    } catch (e) {
      isMatch = false;
    }

    if (!isMatch) return res.status(403).json({ ok: false, error: 'not_matched' });

    // Update the item contact to the requester's email and set owner if column exists
    try {
      const updates = { contact: requesterEmail };
      // attempt to set owner field too (if present)
      updates.owner = requesterEmail;
      const upd = await supabase.from('items').update(updates).eq('id', id).select().single();
      if (upd.error) {
        // still return success but include warning
        return res.json({ ok: true, warning: 'updated_contact_only' });
      }
      return res.json({ ok: true, item: upd.data });
    } catch (e) {
      return res.status(500).json({ ok: false, error: 'update_failed' });
    }
  } catch (e) {
    console.log('⚠️ claim-ownership error', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// ------------------ UPDATE ITEM ------------------
// PATCH /items/:id
app.patch('/items/:id', requireOwner, async (req, res) => {
  try {
    const id = req.params.id;
    const updates = {};

    console.log('🛠️ PATCH /items request', {
      id,
      headers: {
        email: req.headers['x-user-email'] || req.headers['x_user_email'] || null,
        phone: req.headers['x-user-phone'] || req.headers['x_user_phone'] || null,
      },
    });

    // Allow updating these fields if provided
    const allowed = ['name','category','description','location','contact','security_question','type'];
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }

    // If a new security_answer is provided, normalize and hash it before storing
    if (req.body.security_answer !== undefined && req.body.security_answer !== null && String(req.body.security_answer).trim() !== '') {
      const raw = String(req.body.security_answer || '').trim().toLowerCase();
      updates.security_answer = bcrypt.hashSync(raw, 10);
    }

    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'no_updates' });

    const { data, error } = await supabase.from('items').update(updates).eq('id', id).select().single();
    if (error) {
      console.log('⚠️ update item error', error);
      return res.status(500).json({ error: error.message || String(error) });
    }

    res.json(data);
  } catch (e) {
    console.log('⚠️ update unexpected', e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

// ------------------ DELETE ITEM ------------------
app.delete("/items/:id", requireOwner, async (req, res) => {
  try {
    const id = req.params.id;

    console.log('🗑️ DELETE /items request', {
      id,
      headers: {
        email: req.headers['x-user-email'] || req.headers['x_user_email'] || null,
        phone: req.headers['x-user-phone'] || req.headers['x_user_phone'] || null,
      },
    });

    // fetch row
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    // delete image from bucket
    if (data.image_url) {
      const fileName = data.image_url.split("/").pop();

      const { error: delErr } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([fileName]);

      if (delErr) console.log("⚠️ File delete error:", delErr);
    }

    // delete database row
    await supabase.from("items").delete().eq("id", id);

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------ START SERVER ------------------
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
