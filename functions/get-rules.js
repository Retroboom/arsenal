/**
 * Rulebook redirect — Cloudflare Pages Function.
 *
 * GET /get-rules?to=wargamevault|wargamelibrary&src=<where the link was>
 *
 * Sends the visitor to the rulebook's storefront listing and counts the click.
 * The point is metrics: WargameVault scores a game by completed downloads and
 * Wargame Library tracks visits, so every link in the Arsenal goes through
 * here. That gives a count of how many people the Arsenal sends, which
 * WargameVault doesn't show (it only sees completed downloads), and lets the
 * destination change later without editing every link in the app.
 *
 * Counts live at metrics/rulebookClicks/{to}/{YYYY-MM-DD}/{src}. That node has
 * no client rules, so only the service account (this Function, and the
 * admin-write-path tool for reading it back) can touch it.
 *
 * Only destinations in DESTINATIONS are reachable, so this can't be used as an
 * open redirect.
 */

import { getFirebaseToken, fbGet, fbSet } from './_firebase.js';

const DESTINATIONS = {
  wargamevault: 'https://www.wargamevault.com/en/product/188181/hail-of-fire',
  // Homepage until there is a Hail of Fire page to point at; swap it here.
  wargamelibrary: 'https://www.wargamelibrary.com',
};

async function countClick(env, to, src) {
  const day = new Date().toISOString().slice(0, 10);
  const path = `metrics/rulebookClicks/${to}/${day}/${src}`;
  const token = await getFirebaseToken(env.FIREBASE_SERVICE_ACCOUNT);
  const current = await fbGet(token, path);
  await fbSet(token, path, (Number.isFinite(current) ? current : 0) + 1);
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const to = DESTINATIONS[url.searchParams.get('to')] ? url.searchParams.get('to') : 'wargamevault';
  const rawSrc = (url.searchParams.get('src') || '').toLowerCase();
  const src = /^[a-z0-9-]{1,24}$/.test(rawSrc) ? rawSrc : 'unknown';

  const dest = new URL(DESTINATIONS[to]);
  dest.searchParams.set('utm_source', 'arsenal');
  dest.searchParams.set('utm_medium', src);

  // Redirect first and count in the background, so a counting failure can
  // never stand between a visitor and the rulebook.
  context.waitUntil(countClick(env, to, src).catch(err => console.error('get-rules count failed:', err)));

  return new Response(null, {
    status: 302,
    headers: { Location: dest.toString(), 'Cache-Control': 'no-store' },
  });
}
