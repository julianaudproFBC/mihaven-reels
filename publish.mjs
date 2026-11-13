// Publie le prochain Reel de queue.json sur Instagram (API Instagram, connexion Instagram), puis note-le dans published.json.
// Variables : IG_TOKEN (jeton utilisateur Facebook longue durée, droits instagram_content_publish), PAGES_URL (adresse publique des vidéos, GitHub Pages).
import fs from 'node:fs';
const API = 'https://graph.facebook.com/v21.0';
const IG_ID = process.env.IG_ID || '17841475966746330'; // @mihaven.ma
const token = process.env.IG_TOKEN, base = (process.env.PAGES_URL || '').replace(/\/$/, '');
if (!token) { console.log('IG_TOKEN absent : rien à faire'); process.exit(0); }
const queue = JSON.parse(fs.readFileSync('queue.json', 'utf8'));
const done = JSON.parse(fs.readFileSync('published.json', 'utf8'));
const next = queue.find(q => !done.some(d => d.id === q.id));
if (!next) { console.log('File vide : tout est publié'); process.exit(0); }
const call = async (path, params = {}, method = 'GET') => {
  const u = new URL(API + path); for (const [k, v] of Object.entries({ ...params, access_token: token })) u.searchParams.set(k, v);
  const r = await fetch(u, { method }); const j = await r.json(); if (j.error) throw new Error(`${path}: ${j.error.message}`); return j; };
const me = await call(`/${IG_ID}`, { fields: 'id,username' });
if (me.username !== (process.env.IG_USERNAME || 'mihaven.ma')) throw new Error(`compte inattendu : ${me.username}`);
const video_url = `${base}/${next.video}`;
console.log('publie', next.id, 'depuis', video_url);
const { id: cid } = await call(`/${me.id}/media`, { media_type: 'REELS', video_url, caption: next.caption, share_to_feed: 'true', thumb_offset: '600' }, 'POST');
let st = '';
for (let i = 0; i < 60; i++) { st = (await call(`/${cid}`, { fields: 'status_code,status' })).status_code; if (st === 'FINISHED') break; if (st === 'ERROR') throw new Error('conteneur en erreur'); await new Promise(r => setTimeout(r, 10000)); }
if (st !== 'FINISHED') throw new Error('conteneur pas prêt : ' + st);
const { id: mid } = await call(`/${me.id}/media_publish`, { creation_id: cid }, 'POST');
const { permalink } = await call(`/${mid}`, { fields: 'permalink' });
done.push({ id: next.id, media: mid, permalink, at: new Date().toISOString() });
fs.writeFileSync('published.json', JSON.stringify(done, null, 1) + '\n');
console.log('publié', next.id, permalink);
