#!/usr/bin/env node
/* Build + encrypt the dashboard.
 *
 *   DASHBOARD_PASSWORD='your-password' node tools/build.mjs
 *
 * 1. Inlines src/index.html + its local CSS/JS into one self-contained page
 *    (dist/dashboard.html, git-ignored, for local preview).
 * 2. Encrypts that page with AES-256-GCM, key derived from the password with
 *    PBKDF2-SHA256 (600,000 iterations), and writes index.html: a login page
 *    that decrypts in the browser. Without the password the page is unreadable.
 * 3. Encrypts the editable source tree (src/) into source.enc with the same
 *    password, so the repository never holds the dashboard in plain text.
 *    Restore it with: node tools/decrypt.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { webcrypto as crypto } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const ITER = 600000;

const password = process.env.DASHBOARD_PASSWORD || process.argv[2];
if (!password || password.length < 8) {
  console.error('Set a password of at least 8 characters: DASHBOARD_PASSWORD=... node tools/build.mjs');
  process.exit(1);
}

// 1. inline local assets
let html = readFileSync(join(SRC, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="\.\/([^"]+)">/g, (_, p) => `<style>\n${readFileSync(join(SRC, p), 'utf8')}\n</style>`);
html = html.replace(/<script src="\.\/([^"]+)"><\/script>/g, (_, p) => `<script>\n${readFileSync(join(SRC, p), 'utf8').replace(/<\/script/gi, '<\\/script')}\n</script>`);
mkdirSync(join(ROOT, 'dist'), { recursive: true });
writeFileSync(join(ROOT, 'dist', 'dashboard.html'), html);

// 2. encrypt
const b64 = (u8) => Buffer.from(u8).toString('base64');
async function encrypt(bytes) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes));
  return { v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) };
}
const payload = await encrypt(gzipSync(Buffer.from(html, 'utf8'), { level: 9 }));
const gate = readFileSync(join(ROOT, 'tools', 'gate.html'), 'utf8').replace('/*__PAYLOAD__*/null', JSON.stringify(payload));
writeFileSync(join(ROOT, 'index.html'), gate);

// 3. encrypted source bundle
const files = {};
(function walk(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p); else files[relative(ROOT, p).split('\\').join('/')] = readFileSync(p, 'utf8');
  }
})(SRC);
writeFileSync(join(ROOT, 'source.enc'), JSON.stringify(await encrypt(gzipSync(Buffer.from(JSON.stringify(files), 'utf8'), { level: 9 }))));

console.log(`index.html   ${(gate.length / 1024).toFixed(0)} KB (encrypted dashboard)`);
console.log(`source.enc   ${Object.keys(files).length} source files (encrypted)`);
console.log(`dist/dashboard.html  plain preview (not committed)`);
