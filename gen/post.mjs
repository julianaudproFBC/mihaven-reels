// Envoie gen/build/reel.mp4 sur Instagram (@mihaven.ma) par téléversement direct (upload_type=resumable), publie, note dans history.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const B = path.join(ROOT, 'gen', 'build'), HIST = path.join(ROOT, 'history.json');
const API = 'https://graph.facebook.com/v21.0', IG_ID = process.env.IG_ID || '17841475966746330', token = process.env.IG_TOKEN;
if (!token) { console.log('IG_TOKEN absent : rien publié'); process.exit(0); }
const meta = JSON.parse(fs.readFileSync(path.join(B, 'meta.json'), 'utf8')), file = fs.readFileSync(path.join(B, 'reel.mp4'));
const call = async (p, params = {}, method = 'GET') => {
  const u = new URL(API + p); for (const [k, v] of Object.entries({ ...params, access_token: token })) u.searchParams.set(k, v);
  const j = await (await fetch(u, { method })).json(); if (j.error) throw new Error(`${p}: ${j.error.message}`); return j; };
const me = await call(`/${IG_ID}`, { fields: 'username' });
if (me.username !== 'mihaven.ma') throw new Error(`compte inattendu : ${me.username}`);
const { id: cid, uri } = await call(`/${IG_ID}/media`, { media_type: 'REELS', upload_type: 'resumable', caption: meta.caption, share_to_feed: 'true', thumb_offset: '600' }, 'POST');
const up = await (await fetch(uri, { method: 'POST', headers: { Authorization: `OAuth ${token}`, offset: '0', file_size: String(file.length) }, body: file })).json();
if (!up.success) throw new Error('téléversement : ' + JSON.stringify(up));
let st = '';
for (let i = 0; i < 60; i++) { st = (await call(`/${cid}`, { fields: 'status_code' })).status_code; if (st === 'FINISHED') break; if (st === 'ERROR') throw new Error('conteneur en erreur'); await new Promise(r => setTimeout(r, 10000)); }
if (st !== 'FINISHED') throw new Error('conteneur pas prêt : ' + st);
const { id: mid } = await call(`/${IG_ID}/media_publish`, { creation_id: cid }, 'POST');
const { permalink } = await call(`/${mid}`, { fields: 'permalink' });
const hist = fs.existsSync(HIST) ? JSON.parse(fs.readFileSync(HIST, 'utf8')) : [];
hist.push({ ...meta, caption: undefined, media: mid, permalink, at: new Date().toISOString() });
fs.writeFileSync(HIST, JSON.stringify(hist, null, 1) + '\n');
console.log('publié', meta.id, meta.format, permalink);
