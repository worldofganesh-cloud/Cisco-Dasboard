#!/usr/bin/env node
/* Restore the editable source tree (src/) from source.enc.
 *
 *   DASHBOARD_PASSWORD='your-password' node tools/decrypt.mjs
 *
 * Then edit files in src/ and rebuild with tools/build.mjs (same or new password).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { webcrypto as crypto } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const password = process.env.DASHBOARD_PASSWORD || process.argv[2];
if (!password) { console.error('Usage: DASHBOARD_PASSWORD=... node tools/decrypt.mjs'); process.exit(1); }

const p = JSON.parse(readFileSync(join(ROOT, 'source.enc'), 'utf8'));
const u8 = (s) => new Uint8Array(Buffer.from(s, 'base64'));
const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: u8(p.salt), iterations: p.iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
let plain;
try { plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u8(p.iv) }, key, u8(p.ct)); }
catch { console.error('Wrong password.'); process.exit(1); }
const files = JSON.parse(gunzipSync(Buffer.from(plain)).toString('utf8'));
for (const [rel, content] of Object.entries(files)) {
  const out = join(ROOT, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, content);
  console.log('restored', rel);
}
