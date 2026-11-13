// Moteur commun des Reels Mi-Haven : chaque page déclare window.REEL = { bg, layers: [...] } puis charge ce fichier.
// Tout est une fonction pure de t (window.setT), pour short.mjs capture.
(function () {
  const BX = '#69393C', CREAM = '#F4ECE6';
  const css = `
  @font-face{font-family:IS;src:url(../../lib/fonts/InstrumentSerif-Italic.ttf)}
  @font-face{font-family:ISR;src:url(../../lib/fonts/InstrumentSerif-Regular.ttf)}
  @font-face{font-family:DM;src:url(../../lib/fonts/DMSans.ttf)}
  html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#0b0b0b}
  #st{position:absolute;inset:0;overflow:hidden}
  .L{position:absolute;will-change:transform,opacity}
  .ph{overflow:hidden;background:#111}
  .ph img{position:absolute;left:50%;top:50%;width:100%;height:100%;object-fit:cover;transform-origin:50% 50%}
  .serif{font:400 150px/0.98 IS,serif;color:#fff;letter-spacing:-2px;text-shadow:0 4px 30px rgba(0,0,0,.35)}
  .serifR{font:400 150px/0.98 ISR,serif;color:#fff;letter-spacing:-2px}
  .sans{font:600 64px/1.12 DM,sans-serif;color:#fff;letter-spacing:-.5px;text-shadow:0 2px 18px rgba(0,0,0,.45)}
  .kick{font:700 34px DM,sans-serif;color:#fff;letter-spacing:8px;text-transform:uppercase;text-shadow:0 2px 12px rgba(0,0,0,.5)}
  .dark{color:#1d1416;text-shadow:none}
  .bx{color:${BX};text-shadow:none}
  .pill{display:inline-block;background:${BX};border-radius:24px;padding:6px 34px 18px;box-shadow:0 10px 40px rgba(0,0,0,.3)}
  .pillw{display:inline-block;background:#fff;color:#1d1416;border-radius:60px;padding:14px 30px;font:700 40px DM,sans-serif;letter-spacing:1px;text-shadow:none}
  .w{display:inline-block}
  .pol{background:#fbf8f4;padding:22px 22px 110px;box-shadow:0 30px 70px rgba(0,0,0,.45);border-radius:4px}
  .pol .im{width:100%;height:100%;background-size:cover;background-position:center}
  .pol .cap{position:absolute;left:0;right:0;bottom:22px;text-align:center;font:400 64px IS,serif;color:#2a1d1f}
  .line{height:6px;background:#fff;border-radius:3px;transform-origin:left}
  .bar{height:14px;border-radius:7px;background:rgba(255,255,255,.25);overflow:hidden}
  .bar i{display:block;height:100%;background:#fff;transform-origin:left}
  `;
  document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);
  const st = document.createElement('div'); st.id = 'st'; document.body.appendChild(st);
  const R = window.REEL; st.style.background = R.bg || '#0b0b0b';
  const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), eo = x => 1 - Math.pow(1 - cl(x), 3), ei = x => cl(x) * cl(x) * cl(x);
  const eb = x => { x = cl(x); const c = 1.5; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const lerp = (a, b, p) => a + (b - a) * p;
  const mk = (cls, html = '') => { const d = document.createElement('div'); d.className = 'L ' + cls; d.innerHTML = html; st.appendChild(d); return d; };
  const place = (el, L) => { const [x, y, w, h] = L.rect || [0, 0, 1080, 1920]; Object.assign(el.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', borderRadius: (L.r || 0) + 'px', zIndex: L.z || 1 }); if (L.border) el.style.boxShadow = `0 0 0 ${L.border}px #fff, 0 30px 70px rgba(0,0,0,.4)`; };
  // anim d'entrée / sortie commune : rise, pop, left, right, fade, drop
  function inout(el, L, t, base = '') {
    const a = L.a, b = L.b ?? 1e9, din = L.din ?? .35, dout = L.dout ?? .2;
    if (t < a || t >= b) { el.style.display = 'none'; return null; } el.style.display = '';
    const p = (L.anim === 'pop' ? eb : eo)((t - a) / din), q = L.noout ? 1 : eo((b - t) / dout);
    let tr = base;
    switch (L.anim || 'rise') {
      case 'rise': tr += ` translateY(${(1 - p) * 60}px)`; break;
      case 'pop': tr += ` scale(${lerp(.6, 1, p)})`; break;
      case 'left': tr += ` translateX(${(1 - p) * -500}px)`; break;
      case 'right': tr += ` translateX(${(1 - p) * 500}px)`; break;
      case 'drop': tr += ` translateY(${(1 - p) * -1400}px) rotate(${(1 - p) * 25}deg)`; break;
      case 'up': tr += ` translateY(${(1 - p) * 1400}px)`; break;
    }
    el.style.transform = tr; el.style.opacity = Math.min(L.anim === 'none' ? 1 : cl(p * 1.6), q);
    if (L.blur !== false && (L.anim || 'rise') === 'rise') el.style.filter = `blur(${(1 - cl(p)) * 10}px)`;
    return p;
  }
  const K = {};
  K.bg = L => { const el = mk(''); place(el, L); el.style.background = L.color || BX; return t => inout(el, { anim: 'fade', ...L }, t); };
  K.dim = L => { const el = mk(''); place(el, L); el.style.background = L.grad || 'linear-gradient(180deg,rgba(0,0,0,.45),rgba(0,0,0,0) 40%,rgba(0,0,0,0) 60%,rgba(0,0,0,.5))'; return t => inout(el, { anim: 'fade', din: .3, ...L }, t); };
  // photo plein cadre ou dans un rectangle : pan + zoom, coup de fouet flou en entrée/sortie, glitch RVB
  K.photo = L => {
    if (L.soft) L = { whip: false, anim: L.a <= 0 ? 'none' : 'fade', din: .6, zoom: [1.03, 1.12], pan: 35, ease: 1, ...L };
    const el = mk('ph'); place(el, L); el.innerHTML = `<img src="${L.src}">`; const im = el.firstChild;
    const d = L.dir ?? 1, z = L.zoom || [1.12, 1.2], px = L.pan ?? 70;
    return t => {
      if (inout(el, { anim: L.anim || 'none', din: L.din ?? .3, noout: true, ...L, blur: false }, t) === null) return;
      let p = cl((t - L.a) / (L.b - L.a)); if (L.ease) p = p * p * (3 - 2 * p); let x = d * lerp(-px, px, p), bl = 0;
      const wi = L.whip === false || L.a <= 0 ? 1 : (t - L.a) / .12, wo = L.whip === false || L.whipout === false ? 1 : (L.b - t) / .12;
      if (wi < 1) { x -= d * (1 - wi) * 520; bl = (1 - wi) * 26; } if (wo < 1) { x += d * (1 - wo) * 620; bl = Math.max(bl, (1 - wo) * 30); }
      im.style.transform = `translate(-50%,-50%) translateX(${x}px) scale(${lerp(z[0], z[1], p)})`;
      let f = bl ? `blur(${bl}px)` : ''; if (L.grade) f += ' ' + L.grade; if (L.bw) f += ` grayscale(${cl(1 - (t - L.bw) / .6)})`;
      im.style.filter = f; if (L.glitch && t - L.a < .1) im.style.filter += ' drop-shadow(-26px 0 0 rgba(255,0,60,.6)) drop-shadow(26px 0 0 rgba(0,200,255,.6))';
    };
  };
  // texte : html avec mots ; stagger par mot si L.words
  K.text = L => {
    const el = mk(L.cls || 'sans'); el.style.left = (L.x ?? 80) + 'px'; el.style.top = (L.y ?? 300) + 'px'; el.style.zIndex = L.z || 20;
    if (L.w) el.style.width = L.w + 'px'; else if (!L.center) el.style.width = (1000 - (L.x ?? 80)) + 'px'; if (L.align) el.style.textAlign = L.align; if (L.size) el.style.fontSize = L.size + 'px'; if (L.color) el.style.color = L.color;
    if (L.words) el.innerHTML = L.html.split(' ').map(w => `<span class="w">${w}</span>`).join(' '); else el.innerHTML = L.html;
    if (L.center) { el.style.left = '0'; el.style.width = '1080px'; el.style.textAlign = 'center'; }
    const ws = [...el.querySelectorAll('.w')];
    return t => {
      if (inout(el, L.words ? { ...L, anim: 'none' } : L, t) === null) return;
      ws.forEach((w, i) => { const p = eo((t - L.a - i * (L.ws ?? .09)) / .3); w.style.opacity = p; w.style.transform = `translateY(${(1 - p) * 40}px)`; w.style.filter = `blur(${(1 - p) * 8}px)`; });
    };
  };
  K.pill = L => { const el = mk('serif', `<span class="pill">${L.html}</span>`); el.style.left = (L.x ?? 80) + 'px'; el.style.top = (L.y ?? 300) + 'px'; el.style.zIndex = L.z || 20; if (L.size) el.style.fontSize = L.size + 'px'; if (L.center) { el.style.left = 0; el.style.width = '1080px'; el.style.textAlign = 'center'; } const sp = el.firstChild; sp.style.transformOrigin = L.center ? 'center' : 'left';
    return t => { if (inout(el, { ...L, anim: 'none' }, t) === null) return; const p = eb((t - L.a) / .35); sp.style.transform = `scaleX(${cl(p, 0, 1.15)})`; sp.style.color = `rgba(255,255,255,${eo((t - L.a - .1) / .2)})`; }; };
  K.chip = L => { const el = mk('pillw', (L.pin ? `<svg viewBox="0 0 24 24" style="width:36px;height:36px;vertical-align:-8px;margin-right:10px"><path d="M12 22s7-7.2 7-12.5A7 7 0 0 0 5 9.5C5 14.8 12 22 12 22z" fill="${BX}"/><circle cx="12" cy="9.5" r="2.6" fill="#fff"/></svg>` : '') + L.html); el.style.left = (L.x ?? 80) + 'px'; el.style.top = (L.y ?? 300) + 'px'; el.style.zIndex = L.z || 22; return t => inout(el, { anim: 'pop', ...L }, t); };
  K.counter = L => { const el = mk(L.cls || 'serif'); el.style.left = (L.x ?? 80) + 'px'; el.style.top = (L.y ?? 300) + 'px'; el.style.zIndex = 21; if (L.size) el.style.fontSize = L.size + 'px'; if (L.center) { el.style.left = 0; el.style.width = '1080px'; el.style.textAlign = 'center'; }
    return t => { if (inout(el, L, t) === null) return; const p = eo((t - L.a) / (L.dur || 1.4)); el.innerHTML = (L.pre || '') + Math.round(lerp(L.from, L.to, p)) + (L.suf || ''); }; };
  K.line = L => { const el = mk('line'); el.style.left = L.x + 'px'; el.style.top = L.y + 'px'; el.style.width = L.w + 'px'; el.style.zIndex = 21; if (L.color) el.style.background = L.color;
    return t => { if (inout(el, { ...L, anim: 'none' }, t) === null) return; el.style.transform = `scaleX(${eo((t - L.a) / .5)})`; }; };
  K.bar = L => { const el = mk('bar', '<i></i>'); el.style.left = L.x + 'px'; el.style.top = L.y + 'px'; el.style.width = L.w + 'px'; el.style.zIndex = 21; const i = el.firstChild;
    return t => { if (inout(el, { anim: 'fade', ...L }, t) === null) return; i.style.transform = `scaleX(${lerp(L.from ?? 0, L.to ?? 1, eo((t - (L.go ?? L.a)) / (L.dur || .6)))})`; }; };
  K.polaroid = L => { const el = mk('pol', `<div class="im" style="background-image:url('${L.src}')"></div><div class="cap">${L.cap || ''}</div>`); el.style.left = L.x + 'px'; el.style.top = L.y + 'px'; el.style.width = (L.w || 600) + 'px'; el.style.height = (L.h || 620) + 'px'; el.style.zIndex = L.z || 10; el.firstChild.style.height = '100%';
    return t => inout(el, { anim: 'drop', din: .5, ...L }, t, `rotate(${L.rot || 0}deg)`); };
  K.logo = L => { const el = mk('', `<div style="text-align:center"><img src="../../lib/logo-white.png" style="width:${L.w || 660}px"><div class="kick" style="margin-top:26px;letter-spacing:14px">${L.tag || 'CONCIERGERIE &amp; GESTION LOCATIVE'}</div>${L.sub ? `<div class="sans" style="margin-top:60px;font-size:52px">${L.sub}</div>` : ''}</div>`); el.style.left = 0; el.style.width = '1080px'; el.style.top = (L.y ?? 700) + 'px'; el.style.zIndex = 30;
    return t => inout(el, { anim: 'rise', din: .6, ...L }, t); };
  // bouton S'abonner : il arrive, un doigt le touche, il passe à « Abonné »
  // champ de commentaire Instagram qui tape le mot-clé, puis bouton Publier
  K.kw = L => { const W0 = L.w || 880; const el = mk('', `<div style="display:flex;align-items:center;gap:26px;background:#fff;border-radius:70px;padding:22px 34px 22px 22px;box-shadow:0 24px 70px rgba(0,0,0,.35)"><span style="width:84px;height:84px;border-radius:50%;background:${BX};display:inline-flex;align-items:center;justify-content:center;flex:none"><svg viewBox="0 0 24 24" style="width:46px;height:46px"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg></span><span class="tx" style="flex:1;font:700 76px DM,sans-serif;letter-spacing:3px;color:#1d1416;white-space:nowrap"></span><span class="pb" style="font:700 44px DM,sans-serif;color:#0095f6"></span></div>`);
    el.style.left = ((1080 - W0) / 2) + 'px'; el.style.width = W0 + 'px'; el.style.top = (L.y ?? 760) + 'px'; el.style.zIndex = L.z || 30;
    const tx = el.querySelector('.tx'), pb = el.querySelector('.pb'), word = L.word, t0 = L.a + (L.td ?? .45), cps = L.cps ?? 9;
    return t => { if (inout(el, { anim: 'pop', ...L }, t) === null) return; const n = cl(Math.floor((t - t0) * cps), 0, word.length); const done = n >= word.length, tdone = t0 + word.length / cps;
      const caret = (!done || Math.floor((t - tdone) * 2.4) % 2 === 0) && t < tdone + .9 ? '<span style="color:' + BX + '">|</span>' : '';
      tx.innerHTML = (n ? word.slice(0, n) : '<span style="color:#9a9a9a;font-weight:500;letter-spacing:0">Ajouter un commentaire…</span>') + caret;
      tx.style.fontSize = n ? '76px' : '40px'; pb.textContent = done ? 'Publier' : ''; pb.style.opacity = eo((t - tdone) / .25); pb.style.transform = `scale(${t > tdone + .55 && t < tdone + .8 ? .9 : 1})`; }; };
  K.follow = L => { const el = mk('', `<div class="sans" style="font-size:54px;margin-bottom:34px;text-shadow:none">${L.html || 'Abonnez-vous pour la suite'}</div><span class="bt" style="display:inline-block;padding:22px 64px;border-radius:60px;font:700 52px DM,sans-serif;letter-spacing:1px"></span><span class="fg" style="position:absolute;width:70px;height:70px;border-radius:50%;background:rgba(255,255,255,.55);border:5px solid #fff"></span>`);
    el.style.left = 0; el.style.width = '1080px'; el.style.textAlign = 'center'; el.style.top = (L.y ?? 1180) + 'px'; el.style.zIndex = 32; const bt = el.querySelector('.bt'), fg = el.querySelector('.fg');
    return t => { if (inout(el, { anim: 'pop', din: .4, noout: true, ...L }, t) === null) return; const k = t - L.a, done = k > 1.15;
      bt.textContent = done ? 'Abonné ✓' : "+ S'abonner"; bt.style.background = done ? 'transparent' : '#fff'; bt.style.color = done ? '#fff' : '#69393C'; bt.style.boxShadow = done ? 'inset 0 0 0 4px #fff' : '0 14px 40px rgba(0,0,0,.3)';
      bt.style.transform = `scale(${k > 1.0 && k < 1.3 ? .92 : 1})`; const fp = eo((k - .45) / .55); fg.style.left = lerp(820, 600, fp) + 'px'; fg.style.top = lerp(300, 120, fp) + 'px'; fg.style.opacity = k < .45 || k > 1.6 ? 0 : 1; fg.style.transform = `scale(${k > 1.0 && k < 1.25 ? .75 : 1})`; }; };
  K.handle = L => { const el = mk('kick', L.html || 'MI-HAVEN'); el.style.left = (L.x ?? 80) + 'px'; el.style.top = (L.y ?? 120) + 'px'; el.style.zIndex = 25; el.style.opacity = .9; return t => inout(el, { anim: 'fade', ...L }, t); };
  // mosaïque : tuiles qui apparaissent en vague, la caméra recule
  K.grid = L => { const el = mk(''); place(el, L); el.style.zIndex = L.z || 2; const n = L.srcs.length, c = L.cols || 6, tw = L.tw || 300, th = L.th || 380, g = L.gap || 14, rows = Math.ceil(n / c);
    const W = c * tw + (c - 1) * g, H = rows * th + (rows - 1) * g, wrap = document.createElement('div'); wrap.style.cssText = `position:absolute;left:50%;top:50%;width:${W}px;height:${H}px;transform-origin:50% 50%`; el.appendChild(wrap);
    const tiles = L.srcs.map((s, i) => { const d = document.createElement('div'); d.style.cssText = `position:absolute;left:${(i % c) * (tw + g)}px;top:${Math.floor(i / c) * (th + g)}px;width:${tw}px;height:${th}px;border-radius:14px;background:url('${s}') center/cover`; wrap.appendChild(d); return d; });
    return t => { if (inout(el, { anim: 'none', ...L }, t) === null) return; const p = eo((t - L.a) / (L.zdur || 2.6)); wrap.style.transform = `translate(-50%,-50%) scale(${lerp(L.z0 || 3.2, L.z1 || .62, p)}) rotate(${lerp(L.r0 ?? -6, L.r1 ?? 0, p)}deg)`;
      tiles.forEach((d, i) => { const k = eb((t - L.a - (L.order ? L.order[i] : i) * (L.stag ?? .035)) / .35); d.style.opacity = cl(k * 2); d.style.transform = `scale(${cl(k, 0, 1.1)})`; }); }; };
  K.vote = L => { const el = mk('', `<div class="sans" style="font-size:54px;display:flex;justify-content:space-between;width:${L.w || 900}px"><span>${L.A}</span><span>${L.B}</span></div><div style="display:flex;gap:12px;margin-top:16px;width:${L.w || 900}px;height:30px"><i style="background:#fff;border-radius:15px;display:block"></i><i style="background:${BX};border-radius:15px;display:block"></i></div>`); el.style.left = (L.x ?? 90) + 'px'; el.style.top = (L.y ?? 900) + 'px'; el.style.zIndex = 26; const [ia, ib] = el.querySelectorAll('i');
    return t => { if (inout(el, L, t) === null) return; const p = eo((t - L.a - .2) / 1.2), pa = lerp(50, L.pa || 50, p); ia.style.width = pa + '%'; ib.style.width = (100 - pa) + '%'; }; };
  K.clock = L => { const el = mk('', `<svg viewBox="-60 -60 120 120" width="${L.s || 220}" height="${L.s || 220}"><circle r="56" fill="rgba(255,255,255,.95)"/><line class="hh" x1="0" y1="0" x2="0" y2="-28" stroke="${BX}" stroke-width="7" stroke-linecap="round"/><line class="mm" x1="0" y1="0" x2="0" y2="-44" stroke="#1d1416" stroke-width="4" stroke-linecap="round"/><circle r="5" fill="${BX}"/></svg><div class="serif" style="font-size:150px;display:inline-block;vertical-align:top;margin:20px 0 0 30px" data-tm></div>`); el.style.left = (L.x ?? 80) + 'px'; el.style.top = (L.y ?? 260) + 'px'; el.style.zIndex = 24; const hh = el.querySelector('.hh'), mm = el.querySelector('.mm'), tm = el.querySelector('[data-tm]');
    return t => { if (inout(el, { anim: 'pop', ...L }, t) === null) return; let cur = L.keys[0]; for (const k of L.keys) if (t >= k[0]) cur = k; const prev = L.keys[Math.max(0, L.keys.indexOf(cur) - 1)]; const p = eo((t - cur[0]) / .8), h = lerp(prev[1], cur[1], p);
      hh.setAttribute('transform', `rotate(${h * 30})`); mm.setAttribute('transform', `rotate(${h * 360})`); tm.textContent = (cur[2] || (String(Math.round(cur[1])).padStart(2, '0') + ':00')); }; };
  // ---- style FPV (r11) : vol de drone simulé sur une photo
  // zoom + rotation + dérive avec rampe de vitesse (rapide aux bords, lent au milieu), entrée « punch » floue, sortie qui fonce dans l'image
  K.fpv = L => {
    const el = mk('ph'); place(el, L); el.innerHTML = `<img src="${L.src}">`; const im = el.firstChild;
    const z = L.zoom || [1.24, 1.42], r = L.rot || [-3, 3], dx = L.dx || [-40, 40], dy = L.dy || [0, 0], ramp = L.ramp ?? .8, tin = L.tin ?? .16, tout = L.tout ?? .16;
    return t => {
      if (t < L.a || t >= L.b) { el.style.display = 'none'; return; } el.style.display = '';
      const p = cl((t - L.a) / (L.b - L.a)), f = p + ramp * Math.sin(2 * Math.PI * p) / (2 * Math.PI);
      const wi = L.punch === false ? 1 : cl((t - L.a) / tin), wo = L.rush === false ? 1 : cl((L.b - t) / tout);
      const s = lerp(z[0], z[1], f) * (1 + .35 * Math.pow(1 - wi, 2)) * (1 + .65 * Math.pow(1 - wo, 2));
      const bl = Math.max((1 - wi) * 18, (1 - wo) * 26);
      im.style.transform = `translate(-50%,-50%) translate(${lerp(dx[0], dx[1], f)}px,${lerp(dy[0], dy[1], f)}px) rotate(${lerp(r[0], r[1], f)}deg) scale(${s})`;
      im.style.filter = (bl > .2 ? `blur(${bl}px) ` : '') + (L.grade || 'contrast(1.06) saturate(1.08)');
    };
  };
  // flash blanc bref sur une coupe
  K.flash = L => { const el = mk(''); place(el, L); el.style.background = L.color || '#fff'; el.style.zIndex = L.z || 35; const d = L.d || .22;
    return t => { if (t < L.a || t >= L.a + d) { el.style.display = 'none'; return; } el.style.display = ''; el.style.opacity = (L.o ?? .85) * (1 - (t - L.a) / d); }; };
  // reflet de soleil qui traverse le cadre (halo + anneau + taches), en mode écran
  K.flare = L => { const el = mk(''); place(el, L); el.style.zIndex = L.z || 8; el.style.mixBlendMode = 'screen'; el.style.pointerEvents = 'none';
    el.innerHTML = `<div class="h" style="position:absolute;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,rgba(255,244,220,.95),rgba(255,214,160,.35) 18%,rgba(255,190,120,0) 55%)"></div><div class="g" style="position:absolute;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(0,0,0,0) 58%,rgba(160,200,255,.18) 64%,rgba(255,170,120,.14) 70%,rgba(0,0,0,0) 76%)"></div><div class="s" style="position:absolute;width:150px;height:150px;border-radius:50%;background:radial-gradient(circle,rgba(190,140,255,.35),rgba(0,0,0,0) 70%)"></div>`;
    const [h, g, s] = el.children;
    return t => { if (inout(el, { anim: 'fade', din: .3, dout: .3, ...L }, t) === null) return; const p = cl((t - L.a) / (L.b - L.a)), x = lerp(L.x0 ?? 820, L.x1 ?? 620, p), y = lerp(L.y0 ?? 360, L.y1 ?? 420, p);
      h.style.left = (x - 450) + 'px'; h.style.top = (y - 450) + 'px'; g.style.left = (x - 260) + 'px'; g.style.top = (y - 260) + 'px';
      const sx = 540 + (540 - x) * 1.3, sy = 960 + (960 - y) * 1.1; s.style.left = (sx - 75) + 'px'; s.style.top = (sy - 75) + 'px'; el.style.opacity = (L.o ?? .9) * (.85 + .15 * Math.sin(t * 9)); }; };
  // texte manuscrit qui s'écrit de gauche à droite (feutre), légère inclinaison
  K.hand = L => { const el = mk(''); el.style.cssText += `left:${L.x ?? 80}px;top:${L.y ?? 300}px;z-index:${L.z || 24};width:${L.w || 920}px;font:400 ${L.size || 150}px/0.92 HAND,cursive;color:${L.color || '#fff'};text-shadow:0 6px 26px rgba(0,0,0,.45);transform:rotate(${L.tilt ?? -6}deg);transform-origin:left center`;
    el.innerHTML = L.html; const d = L.write ?? .55;
    return t => { if (t < L.a || t >= L.b) { el.style.display = 'none'; return; } el.style.display = ''; const p = eo((t - L.a) / d), q = L.noout ? 1 : eo((L.b - t) / .18);
      el.style.clipPath = `inset(-20% ${100 - p * 100}% -20% -5%)`; el.style.opacity = q; }; };
  if (R.layers && R.layers.some(l => l.k === 'hand')) document.head.insertAdjacentHTML('beforeend', `<style>@font-face{font-family:HAND;src:url(../../lib/fonts/Inkfree.ttf)}</style>`);
  const ups = (R.layers || []).map(L => K[L.k](L));
  window.setT = t => ups.forEach(u => u(t));
  window.setT(0);
})();
