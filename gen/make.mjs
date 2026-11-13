// Agent Reels Mi-Haven : fabrique UN nouveau Reel à chaque appel (format, logement, accroche et musique tournent),
// écrit gen/build/index.html + gen/build/meta.json, et note le choix dans history.json.
// Règles Mi-Haven : « nous », aucun prix, aucun nom de logement ni de propriétaire, aucune info inventée sur un bien.
// Seules infos chiffrées autorisées : 48 logements ; Casablanca, Marrakech, El Jadida ; prêt en moins de 21 jours.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IMG = path.join(ROOT, 'img'), OUT = path.join(ROOT, 'gen', 'build'), HIST = path.join(ROOT, 'history.json');
const hist = fs.existsSync(HIST) ? JSON.parse(fs.readFileSync(HIST, 'utf8')) : [];
const n = hist.length;
// hasard reproductible : graine = numéro du Reel
let seed = 9301 + n * 49297; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = a => a[Math.floor(rnd() * a.length)];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const props = fs.readdirSync(IMG).filter(d => fs.statSync(path.join(IMG, d)).isDirectory());
const photos = p => fs.readdirSync(path.join(IMG, p)).filter(f => /\.jpe?g$/i.test(f)).sort();
const src = (p, f) => `../../img/${p}/${f}`;
// le logement le moins utilisé récemment
const lastUse = p => { for (let i = hist.length - 1; i >= 0; i--) if ((hist[i].props || []).includes(p)) return i; return -1; };
const freshProps = () => shuffle(props).sort((a, b) => lastUse(a) - lastUse(b));
const take = (p, k) => shuffle(photos(p)).slice(0, k).map(f => src(p, f));

// ---------- briques visuelles
const dimB = (a, b) => ({ k: 'dim', a, b, z: 5, grad: 'linear-gradient(180deg,rgba(0,0,0,.45),rgba(0,0,0,0) 32%,rgba(0,0,0,0) 55%,rgba(0,0,0,.6))' });
const prog = (a, b) => ({ k: 'bar', x: 80, y: 150, w: 920, a, b, dur: b - a, din: .01, z: 40 });
const soft = (list, a, step) => list.map((s, i) => ({ k: 'photo', src: s, a: +(a + i * step).toFixed(3), b: +(a + (i + 1) * step + .6).toFixed(3), dir: i % 2 ? -1 : 1, soft: true }));
const whip = (list, a, step) => list.map((s, i) => ({ k: 'photo', src: s, a: +(a + i * step).toFixed(3), b: +(a + (i + 1) * step).toFixed(3), dir: i % 2 ? -1 : 1, ...(i === 0 ? { whip: false } : {}) }));
const hook = (kick, big, sub, b) => [
  ...(kick ? [{ k: 'chip', html: kick, x: 80, y: 300, a: 0, din: .01, b }] : []),
  { k: 'text', cls: 'serif', html: big, x: 80, y: 390, size: 150, a: 0, din: .01, b },
  ...(sub ? [{ k: 'text', cls: 'sans', html: sub, x: 84, y: 700, w: 900, a: 0, din: .01, b }] : [])];
const cta = (word, after, a, b, head) => [
  { k: 'bg', a, b, color: '#69393C', anim: 'none', z: 26 },
  ...(head ? [{ k: 'text', cls: 'sans', html: head, center: 1, y: 530, a, b, z: 30 }] : []),
  { k: 'text', cls: 'serif', html: 'Commentez', center: 1, y: 640, size: 160, a, b, z: 30 },
  { k: 'kw', word, a: a + .3, b, y: 900, z: 30 },
  { k: 'text', cls: 'sans', html: after, center: 1, y: 1130, a: a + 1.4, b, z: 30, size: 60 }];
const end = (a, b, fol) => [{ k: 'bg', a, b, color: '#69393C', z: 28 }, { k: 'logo', a: a + .1, b, y: 520, noout: true }, { k: 'follow', a: a + .35, b, html: fol, y: 1080 }];
const GF = 'et recevez notre formulaire<br>en message privé', SJ = 'et recevez toutes les infos<br>en message privé';
const endOwner = (a) => [...cta('GESTION', GF, a, a + 3.6), ...end(a + 3.6, a + 5.3, pick(['Abonnez-vous pour la suite', 'Abonnez-vous, on vous montre tout', 'Abonnez-vous pour nos conseils']))];
const endTrav = (a) => [...cta('SÉJOUR', SJ, a, a + 3.6, pick(['Ce logement vous plaît ?', 'Envie d\'y séjourner ?', 'Vous restez combien de nuits ?'])), ...end(a + 3.6, a + 5.3, pick(['Abonnez-vous pour la prochaine visite', 'Abonnez-vous pour la suite']))];

// ---------- légendes
const TAGS_T = ['#maroc #locationvacances #visitemaison #mihaven', '#airbnbmaroc #sejourmaroc #mihaven', '#vacancesmaroc #appartement #mihaven', '#casablanca #marrakech #eljadida #mihaven'];
const TAGS_O = ['#gestionlocative #conciergerie #mihaven', '#investissementimmobilier #gestionlocative #casablanca #mihaven', '#conciergerie #airbnbmaroc #revenuspassifs #mihaven', '#immobiliermaroc #gestionlocative #marrakech #mihaven'];
const capT = (l1) => `${l1}\nCommentez SÉJOUR et recevez toutes les infos en message privé. Abonnez-vous pour la prochaine visite.\n\n${pick(TAGS_T)}`;
const capO = (l1) => `${l1}\nCommentez GESTION et recevez notre formulaire en message privé.\n\n${pick(TAGS_O)}`;

// ---------- formats
const T = {};
// 1 · visite douce, voyageurs
T.visite = () => { const p = freshProps()[0], ph = take(p, 9), st = 1.75, a0 = 2.2, e = a0 + ph.length * st;
  const [kick, big, sub] = pick([['VISITE EXPRESS', 'Entrez,', 'on vous fait visiter.'], ['POV', 'Vous posez<br>vos valises ici.', null], ['VISITE', 'Ouvrez<br>la porte.', 'La suite en 15 secondes.'], ['VOTRE PROCHAIN SÉJOUR', 'Et si c\'était<br>ici ?', null]]);
  return { aud: 'T', props: [p], music: pick(['arpege', 'neon']), dur: e + 5.3, cap: capT(pick(['Visite express d\'un de nos logements 🔑', 'On vous fait visiter ? 🏡', 'Votre prochain séjour, en 20 secondes ✨'])),
    layers: [...soft([ph[8], ...ph.slice(0, 8)], 0, (e) / 9), dimB(0, e), prog(0, e), ...hook(kick, big, sub, a0), ...endTrav(e)] }; };
// 2 · coupes rapides, voyageurs
T.rapide = () => { const p = freshProps()[0], ph = take(p, 16), st = .58, a0 = 1.8, e = a0 + 14 * st;
  const big = pick(['Prêt à<br>partir ?', 'Un week-end<br>ici ?', '15 photos.<br>Un seul logement.']);
  return { aud: 'T', props: [p], music: pick(['neon', 'code-noir']), dur: e + 5.3, cap: capT(pick(['Un logement, 15 photos 📸', 'Vous partez quand ? ✈️', 'Le week-end idéal commence ici'])),
    layers: [...whip([ph[15]], 0, a0), ...whip(ph.slice(0, 14), a0, st), dimB(0, e), ...hook(null, big, null, a0), ...endTrav(e)] }; };
// 3 · duel A ou B, voyageurs
T.duel = () => { const [p1, p2] = freshProps(), A = take(p1, 5), B = take(p2, 5), st = 1.6, d = 1.75, L = [];
  for (let i = 0; i < 4; i++) { const a = st + i * d, b = a + d; L.push({ k: 'photo', src: A[i], a, b, rect: [0, 0, 1080, 950], dir: 1 }, { k: 'photo', src: B[i], a, b, rect: [0, 970, 1080, 950], dir: -1 }); }
  const e = st + 4 * d;
  return { aud: 'T', props: [p1, p2], music: 'code-noir', dur: e + 2.6 + 2.8, cap: `Vous choisissez lequel : A ou B ? Répondez en commentaire 👇\nLes deux sont chez Mi-Haven. Abonnez-vous pour le prochain duel.\n\n${pick(TAGS_T)}`,
    layers: [{ k: 'bg', a: 0, b: 30, color: '#0b0b0b', anim: 'none' },
      { k: 'photo', src: A[4], a: 0, b: st, rect: [0, 0, 1080, 950], whip: false }, { k: 'photo', src: B[4], a: 0, b: st, rect: [0, 970, 1080, 950], whip: false, dir: -1 },
      { k: 'pill', html: pick(['Vous choisissez lequel ?', 'A ou B ?', 'Un seul choix']), center: 1, y: 868, size: 88, a: -.5, b: st, din: .01, z: 24 }, ...L,
      { k: 'text', cls: 'serif', html: 'A', x: 70, y: 60, size: 220, a: 0, b: e + 2.6, z: 25, din: .01 }, { k: 'text', cls: 'serif', html: 'B', x: 70, y: 1700, size: 220, a: 0, b: e + 2.6, z: 25, din: .01 },
      { k: 'photo', src: A[0], a: e, b: e + 2.6, rect: [0, 0, 1080, 950], dir: 1 }, { k: 'photo', src: B[0], a: e, b: e + 2.6, rect: [0, 970, 1080, 950], dir: -1 },
      { k: 'pill', html: 'Répondez A ou B', center: 1, y: 860, size: 104, a: e + .05, b: e + 2.6, z: 24 },
      ...end(e + 2.6, e + 5.4, 'Abonnez-vous pour le prochain duel')] }; };
// 4 · carnet de polaroids, voyageurs
T.carnet = () => { const p = freshProps()[0], ph = take(p, 10), pos = [[90, 470, -6], [400, 560, 5], [120, 900, 4], [420, 1000, -5]];
  const big = pick(['Une semaine<br>ici ?', 'Carnet<br>de voyage', 'Vos souvenirs<br>commencent ici']);
  const e = 3.2 + 6 * 1.3;
  return { aud: 'T', props: [p], music: pick(['arpege', 'filature']), dur: e + 5.3, cap: capT(pick(['Une semaine ici, ça vous tente ? 📸', 'Carnet de voyage 📒', 'Ça ressemble à des vacances 🌴'])),
    layers: [{ k: 'bg', a: 0, b: 3.2, color: '#F4ECE6', anim: 'none' },
      { k: 'text', cls: 'kick bx', html: 'Carnet de voyage', x: 80, y: 150, a: 0, b: 3.2, din: .01 },
      { k: 'text', cls: 'serif dark', html: big, x: 80, y: 200, size: 130, a: 0, b: 3.2, din: .01 },
      ...pos.map(([x, y, rot], i) => ({ k: 'polaroid', src: ph[i], cap: '', x, y, rot, w: 560, h: 600, a: i ? i * .65 : -.6, b: 3.2, z: 10 + i, din: .45 })),
      ...soft(ph.slice(4, 10), 2.9, 1.3), dimB(2.9, e), prog(2.9, e), ...endTrav(e)] }; };
// 5 · mosaïque 48 logements, propriétaires
T.mosaique = () => { const all = []; const ps = shuffle(props); for (let i = 0; i < 48; i++) { const p = ps[i % ps.length]; all.push(src(p, pick(photos(p)))); }
  const e = 6.4;
  return { aud: 'O', props: [], music: 'neon', dur: e + 3 + 5.3, cap: capO(pick(['Nous gérons 48 logements entre Casablanca, Marrakech et El Jadida.', '48 logements. 3 villes. Une seule équipe.', 'Le prochain logement que nous gérons, c\'est peut-être le vôtre.'])),
    layers: [{ k: 'bg', a: 0, b: 40, color: '#1a1012', anim: 'none' },
      { k: 'grid', srcs: all, cols: 8, tw: 250, th: 330, a: -1.2, b: e, z0: 2.6, z1: .52, zdur: 2.4, stag: .022, r0: -8, r1: -4 },
      { k: 'dim', a: 0, b: e, z: 3, grad: 'radial-gradient(circle at 50% 50%,rgba(0,0,0,.65),rgba(0,0,0,.25) 70%)' },
      { k: 'text', cls: 'sans', html: 'Nous gérons', center: 1, y: 540, a: 0, din: .01, b: e, z: 22 },
      { k: 'counter', from: 0, to: 48, a: -.5, b: e, dur: 1.8, center: 1, y: 640, size: 420, anim: 'none' },
      { k: 'text', cls: 'kick', html: 'logements', center: 1, y: 1110, a: 0, din: .01, b: e, size: 46 },
      { k: 'chip', html: 'CASABLANCA', pin: 1, x: 120, y: 1260, a: 2.2, b: e }, { k: 'chip', html: 'MARRAKECH', pin: 1, x: 300, y: 1370, a: 2.7, b: e }, { k: 'chip', html: 'EL JADIDA', pin: 1, x: 560, y: 1480, a: 3.2, b: e },
      ...soft(take(freshProps()[0], 2), e, 1.5), dimB(e, e + 3),
      { k: 'text', cls: 'sans', html: 'Le prochain,', x: 80, y: 360, a: e, b: e + 3 }, { k: 'text', cls: 'serif', html: 'c\'est le vôtre ?', x: 80, y: 450, size: 150, a: e + .4, b: e + 3 },
      ...endOwner(e + 3)] }; };
// 6 · « votre appartement est vide ? », propriétaires
T.vide = () => { const p = freshProps()[0], ph = take(p, 6);
  return { aud: 'O', props: [p], music: 'code-noir', dur: 15.6, cap: capO(pick(['Votre appartement est vide ? Nous le meublons, nous le décorons, et il est prêt en moins de 21 jours.', 'Un appartement vide ne rapporte rien. Prêt en moins de 21 jours avec nous.'])),
    layers: [{ k: 'photo', src: ph[0], a: 0, b: 2.6, grade: 'grayscale(1) brightness(.85)', zoom: [1.2, 1.1], whip: false }, dimB(0, 2.6),
      { k: 'text', cls: 'sans', html: 'Votre appartement', x: 80, y: 420, a: 0, b: 2.6, din: .01 }, { k: 'text', cls: 'serif', html: 'est vide ?', x: 80, y: 510, size: 210, a: 0, din: .01, b: 2.6 },
      ...whip(ph.slice(1, 3), 2.6, 1.3), dimB(2.6, 5.2),
      { k: 'pill', html: 'Nous le meublons.', x: 80, y: 420, size: 110, a: 2.6, b: 3.9 }, { k: 'pill', html: 'Nous le décorons.', x: 80, y: 420, size: 110, a: 3.9, b: 5.2 },
      { k: 'bg', a: 5.2, b: 7.6, color: '#69393C', anim: 'none', z: 10 },
      { k: 'text', cls: 'sans', html: 'Prêt en moins de', center: 1, y: 520, a: 5.2, b: 7.6, z: 12 },
      { k: 'counter', from: 0, to: 21, a: 5.4, b: 7.6, dur: 1.6, center: 1, y: 620, size: 460, z: 12 },
      { k: 'text', cls: 'serif', html: 'jours', center: 1, y: 1090, size: 170, a: 5.7, b: 7.6, z: 12 },
      ...soft(ph.slice(3, 6), 7.6, .9), dimB(7.6, 10.3),
      { k: 'text', cls: 'sans', html: 'Ensuite,', x: 80, y: 1360, a: 7.6, b: 10.3 }, { k: 'text', cls: 'serif', html: 'on s\'occupe de tout.', x: 80, y: 1450, size: 140, a: 8, b: 10.3 },
      ...endOwner(10.3)] }; };
// 7 · détails, gros plans lents, propriétaires
T.details = () => { const p = freshProps()[0], ph = take(p, 6), L = [], st = 1.6;
  ph.forEach((s, i) => { const a = i * st, b = a + st; L.push({ k: 'photo', src: s, a, b, whip: false, zoom: [1.06, 1.22], pan: 25, dir: i % 2 ? -1 : 1, anim: i ? 'fade' : 'none', din: .25 }, { k: 'text', cls: 'kick', html: `0${i + 1} / 06`, x: 80, y: 1500, a: i ? a + .1 : 0, din: i ? .35 : .01, b }); });
  const e = ph.length * st, head = pick(['Les détails que vos voyageurs remarquent', 'Rien n\'est laissé au hasard', 'Ce qui fait revenir les voyageurs']);
  return { aud: 'O', props: [p], music: 'enquete', dur: e + 5.3 + 2.4, cap: capO(pick(['Les détails font la différence. Votre bien mérite le même soin.', 'Rien n\'est laissé au hasard dans nos logements.'])),
    layers: [...L, dimB(0, e), prog(0, e), { k: 'text', cls: 'sans', html: head, x: 80, y: 220, w: 900, size: 66, a: 0, b: e, din: .01, z: 22 },
      { k: 'bg', a: e, b: e + 2.4, color: '#69393C', anim: 'fade', z: 26 }, { k: 'text', cls: 'serif', html: 'Votre bien mérite<br>le même soin ?', center: 1, y: 700, size: 140, a: e + .15, b: e + 2.4, z: 30 },
      ...endOwner(e + 2.4)] }; };
// 8 · méthode en 3 étapes, propriétaires
T.etapes = () => { const p = freshProps()[0], ph = take(p, 4), S = ['Vous nous envoyez les photos et les infos de votre bien.', 'S\'il correspond à nos critères, nous venons le visiter.', 'S\'il est vide, nous le meublons : prêt en moins de 21 jours.'], st = 3.2;
  const step = (k, a, b) => [{ k: 'photo', src: ph[k + 1], a, b, rect: [0, 0, 1080, 1060], dir: k % 2 ? -1 : 1 }, { k: 'bg', a, b, color: '#69393C', anim: 'none', rect: [0, 1060, 1080, 860] },
    { k: 'text', cls: 'serifR', html: String(k + 1), x: 80, y: 1090, size: 300, a, b, anim: 'pop', color: 'rgba(255,255,255,.95)' },
    { k: 'text', cls: 'sans', html: S[k], x: 80, y: 1450, w: 920, a: a + .2, b, words: 1, ws: .05, size: 60 }, { k: 'bar', x: 300, y: 1185, w: 700, a, b, from: k / 3, to: (k + 1) / 3, go: a + .1 }];
  const e = 2.6 + 3 * st;
  return { aud: 'O', props: [p], music: 'arpege', dur: e + 5.3, cap: capO('Confier son appartement à Mi-Haven, en 3 étapes. Enregistrez ce Reel pour plus tard.'),
    layers: [{ k: 'photo', src: ph[0], a: 0, b: 2.6, whip: false }, dimB(0, 2.6), { k: 'chip', html: '3 ÉTAPES', x: 80, y: 270, a: 0, din: .01, b: 2.6 },
      { k: 'text', cls: 'sans', html: 'Confier son appartement<br>à&nbsp;Mi-Haven,', x: 80, y: 360, w: 920, a: 0, b: 2.6, din: .01 }, { k: 'pill', html: 'c\'est simple.', x: 80, y: 560, size: 140, a: .4, b: 2.6 },
      ...step(0, 2.6, 2.6 + st), ...step(1, 2.6 + st, 2.6 + 2 * st), ...step(2, 2.6 + 2 * st, e), ...endOwner(e)] }; };

// rotation : 6 propriétaires pour 4 voyageurs, jamais deux fois le même format d'affilée
const ORDER = ['visite', 'mosaique', 'rapide', 'vide', 'details', 'duel', 'etapes', 'carnet', 'mosaique', 'visite', 'details', 'vide', 'rapide', 'etapes', 'duel', 'carnet'];
const name = process.argv[2] || ORDER[n % ORDER.length];
const r = T[name]();
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), `<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.REEL=${JSON.stringify({ bg: '#0b0b0b', layers: r.layers })};</script><script src="../../lib/reel.js"></script></body></html>`);
const id = `g${String(n + 1).padStart(4, '0')}`;
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify({ id, format: name, aud: r.aud, props: r.props, music: r.music, dur: +r.dur.toFixed(2), caption: r.cap }, null, 1));
console.log(id, name, r.aud, r.props.join('+'), r.music, r.dur.toFixed(1) + ' s');
