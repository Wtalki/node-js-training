import crypto from 'crypto';
import { linksDb, getNextId } from './db.js';

export function isValidUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function generateUniqueCode(length = 6) {
  while (true) {
    const code = crypto.randomBytes(length).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, length);
    if (!code) continue;
    const exists = await linksDb.findOne({ shortCode: code });
    if (!exists) return code;
  }
}

export async function createLink(url) {
  const now = new Date().toISOString();
  const doc = {
    id: await getNextId(),
    url,
    shortCode: await generateUniqueCode(6),
    createdAt: now,
    updatedAt: now,
    accessCount: 0
  };
  await linksDb.insert(doc);
  return doc;
}

export async function findByCode(code) {
  return linksDb.findOne({ shortCode: code });
}

export async function updateUrl(code, url) {
  const doc = await findByCode(code);
  if (!doc) return null;
  const updated = { ...doc, url, updatedAt: new Date().toISOString() };
  await linksDb.update({ shortCode: code }, updated, { upsert: false });
  return updated;
}

export async function removeByCode(code) {
  return linksDb.remove({ shortCode: code }, { multi: false });
}

export async function incrementAccess(code) {
  await linksDb.update({ shortCode: code }, { $set: { updatedAt: new Date().toISOString() }, $inc: { accessCount: 1 } });
}


