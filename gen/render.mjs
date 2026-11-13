// Rend gen/build/index.html (window.setT) en gen/build/reel.mp4 : images par Chrome sans écran, musique, -14 LUFS.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const B = path.join(ROOT, 'gen', 'build'), meta = JSON.parse(fs.readFileSync(path.join(B, 'meta.json'), 'utf8'));
const FPS = 30, N = Math.round(meta.dur * FPS);
let pw; try { pw = await import('playwright'); } catch { pw = await import('playwright-core'); }
const browser = await pw.chromium.launch({ headless: true, executablePath: process.env.CHROME || undefined, args: ['--allow-file-access-from-files', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.log('pageerror:', e.message));
page.on('requestfailed', r => console.log('manquant:', r.url()));
await page.goto(pathToFileURL(path.join(B, 'index.html')).href);
await page.evaluate(() => Promise.all([...document.fonts].map(f => f.load().catch(() => {}))).then(() => Promise.all([...document.images].map(i => i.decode().catch(() => {})))));
await page.waitForTimeout(500);
const silent = path.join(B, 'silent.mp4');
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-pix_fmt', 'yuv420p', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let i = 0; i < N; i++) {
  await page.evaluate(t => window.setT(t), i / FPS);
  const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % 150 === 0) console.log(`image ${i}/${N} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  if (i === Math.round(0.6 * FPS)) fs.writeFileSync(path.join(B, 'cover.jpg'), buf);
}
ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close();
const d = meta.dur, mu = path.join(ROOT, 'music', `${meta.music}.mp3`), lp = meta.music === 'filature' ? ',lowpass=f=2400' : '';
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', silent, '-i', mu, '-filter_complex',
  `[1:a]atrim=0:${d},asetpts=PTS-STARTPTS,aresample=48000${lp},afade=t=in:d=0.3,afade=t=out:st=${(d - 1.2).toFixed(2)}:d=1.2,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]`,
  '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-t', String(d), '-movflags', '+faststart', path.join(B, 'reel.mp4')]);
fs.unlinkSync(silent);
console.log('rendu', meta.id, `${fs.statSync(path.join(B, 'reel.mp4')).size >> 10} Ko`, `${((Date.now() - t0) / 1000).toFixed(0)} s`);
